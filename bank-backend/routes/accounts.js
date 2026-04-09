const express = require("express");
const router  = express.Router();
const db      = require("../db");

router.get("/", (req, res) => {
  const { search, page = 1, limit = 10 } = req.query
  const offset  = (Number(page) - 1) * Number(limit)
  const isAdmin = req.user.role === "admin"
  let sql = `SELECT id, name, email, balance, role, COALESCE(status,'active') AS status FROM users`
  let where = []; let params = []
  if (!isAdmin) { where.push("id = ?"); params.push(req.user.id) }
  if (search)   { where.push("(name LIKE ? OR email LIKE ?)"); params.push(`%${search}%`,`%${search}%`) }
  if (where.length) sql += " WHERE " + where.join(" AND ")
  sql += " ORDER BY id DESC"

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "Server error" })
    let countSql = "SELECT COUNT(*) AS total FROM users"
    let cw = []; let cp = []
    if (!isAdmin) { cw.push("id=?"); cp.push(req.user.id) }
    if (search)   { cw.push("(name LIKE ? OR email LIKE ?)"); cp.push(`%${search}%`,`%${search}%`) }
    if (cw.length) countSql += " WHERE " + cw.join(" AND ")
    db.query(countSql, cp, (err2, cr) => {
      if (err2) return res.status(500).json({ error: "Server error" })
      const accounts = rows.map(u => ({
        id:             u.id,
        account_number: "VE" + String(u.id).padStart(8,"0"),
        holder_name:    u.name,
        email:          u.email,
        balance:        u.balance,
        account_type:   "savings",
        status:         u.status || "active",
        kyc_status:     "verified",
        created_at:     u.created_at || new Date().toISOString(),
      }))
      res.json({ accounts, total: cr[0].total })
    })
  })
})

router.get("/:id", (req, res) => {
  db.query("SELECT * FROM users WHERE id=?", [req.params.id], (err, rows) => {
    if (err || !rows.length) return res.status(404).json({ error: "Not found" })
    const u = rows[0]
    db.query("SELECT * FROM transactions WHERE sender_id=? OR receiver_id=? ORDER BY id DESC LIMIT 5",
      [u.id, u.id], (err2, txs) => {
        res.json({
          id:             u.id,
          account_number: "VE" + String(u.id).padStart(8,"0"),
          holder_name:    u.name,
          email:          u.email,
          balance:        u.balance,
          account_type:   "savings",
          status:         u.status || "active",
          kyc_status:     "verified",
          branch:         "Main Branch",
          ifsc:           "VAULT0001",
          created_at:     u.created_at || new Date().toISOString(),
          recent_transactions: (txs||[]).map(t => ({
            id:          t.id,
            type:        t.sender_id === u.id ? "debit" : "credit",
            amount:      t.amount,
            description: t.sender_id === u.id ? `Transfer to #${t.receiver_id}` : `Transfer from #${t.sender_id}`,
            status:      t.status || "completed",
            created_at:  t.created_at,
          }))
        })
      }
    )
  })
})

router.patch("/:id/status", (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" })
  const { status } = req.body
  if (!['active','frozen','dormant','closed'].includes(status))
    return res.status(400).json({ error: "Invalid status" })
  db.query("UPDATE users SET status=? WHERE id=?", [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "Server error" })
    res.json({ ok: true })
  })
})

module.exports = router
