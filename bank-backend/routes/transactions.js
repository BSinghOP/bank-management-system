const express = require("express");
const router  = express.Router();
const db      = require("../db");

router.get("/", (req, res) => {
  const { page = 1, limit = 15, search } = req.query
  const offset  = (Number(page) - 1) * Number(limit)
  const isAdmin = req.user.role === "admin"
  let where = []; let params = []

  if (!isAdmin) { where.push("(t.sender_id=? OR t.receiver_id=?)"); params.push(req.user.id, req.user.id) }
  if (search)   { where.push("(s.name LIKE ? OR r.name LIKE ?)"); params.push(`%${search}%`, `%${search}%`) }

  const w = where.length ? "WHERE " + where.join(" AND ") : ""

  db.query(
    `SELECT t.*, s.name AS sender_name, r.name AS receiver_name
     FROM transactions t
     LEFT JOIN users s ON t.sender_id   = s.id
     LEFT JOIN users r ON t.receiver_id = r.id
     ${w} ORDER BY t.id DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Server error" })
      const txs = (rows || []).map(t => ({
        id:             t.id,
        type:           t.sender_id === req.user.id ? "debit" : "credit",
        amount:         t.amount,
        account_number: "VE" + String(t.sender_id).padStart(8,"0"),
        description:    `${t.sender_name || "?"} → ${t.receiver_name || "?"}`,
        status:         t.status || "completed",
        created_at:     t.created_at,
      }))

      let countSql = `SELECT COUNT(*) AS total FROM transactions t LEFT JOIN users s ON t.sender_id=s.id LEFT JOIN users r ON t.receiver_id=r.id ${w}`
      db.query(countSql, params, (err2, cr) => {
        res.json({ transactions: txs, total: cr?.[0]?.total || 0 })
      })
    }
  )
})

router.get("/export", (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" })
  db.query(
    `SELECT t.id, s.name AS sender, r.name AS receiver, t.amount, t.created_at
     FROM transactions t
     LEFT JOIN users s ON t.sender_id=s.id
     LEFT JOIN users r ON t.receiver_id=r.id
     ORDER BY t.id DESC LIMIT 5000`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Export failed" })
      const csv = "ID,Sender,Receiver,Amount,Date\n" +
        (rows||[]).map(r => `${r.id},"${r.sender}","${r.receiver}",${r.amount},${r.created_at}`).join("\n")
      res.setHeader("Content-Type", "text/csv")
      res.setHeader("Content-Disposition", `attachment; filename="transactions_${Date.now()}.csv"`)
      res.send(csv)
    }
  )
})

router.patch("/:id/flag", (req, res) => {
  db.query("UPDATE transactions SET status='flagged' WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "Server error" })
    res.json({ ok: true })
  })
})

module.exports = router
