const express = require("express");
const router  = express.Router();
const db      = require("../db");

router.get("/", (req, res) => {
  const isAdmin = req.user.role === "admin"
  const sql = `SELECT f.*, u.name AS holder_name FROM fixed_deposits f JOIN users u ON f.user_id=u.id ${isAdmin?"":"WHERE f.user_id=?"} ORDER BY f.id DESC`
  db.query(sql, isAdmin?[]:[req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Server error" })
    res.json({ fds: rows || [] })
  })
})

router.post("/", (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" })
  const { user_id, principal, interest_rate, tenure_months } = req.body
  if (!principal || !interest_rate || !tenure_months) return res.status(400).json({ error: "All fields required" })
  const maturityAmount = Math.round(principal * (1 + interest_rate/100 * tenure_months/12))
  const maturityDate   = new Date(); maturityDate.setMonth(maturityDate.getMonth() + Number(tenure_months))
  db.query(
    "INSERT INTO fixed_deposits (user_id,principal,interest_rate,tenure_months,maturity_amount,maturity_date,status) VALUES (?,?,?,?,?,?,'active')",
    [user_id||req.user.id, principal, interest_rate, tenure_months, maturityAmount, maturityDate.toISOString().slice(0,10)],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Server error" })
      res.status(201).json({ id: result.insertId, maturityAmount })
    }
  )
})

router.patch("/:id/close", (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" })
  db.query("SELECT * FROM fixed_deposits WHERE id=?", [req.params.id], (err, rows) => {
    if (err || !rows.length) return res.status(404).json({ error: "FD not found" })
    const fd = rows[0]
    db.query("UPDATE users SET balance=balance+? WHERE id=?", [fd.maturity_amount, fd.user_id], (err2) => {
      if (err2) return res.status(500).json({ error: "Server error" })
      db.query("UPDATE fixed_deposits SET status='closed' WHERE id=?", [fd.id], (err3) => {
        if (err3) return res.status(500).json({ error: "Server error" })
        res.json({ ok: true, credited: fd.maturity_amount })
      })
    })
  })
})

module.exports = router
