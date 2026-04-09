const express = require("express");
const router  = express.Router();
const db      = require("../db");

router.get("/", (req, res) => {
  const isAdmin = req.user.role === "admin"
  const sql = `SELECT l.*, u.name AS holder_name FROM loans l JOIN users u ON l.user_id=u.id ${isAdmin?"":"WHERE l.user_id=?"} ORDER BY l.id DESC`
  db.query(sql, isAdmin?[]:[req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Server error" })
    res.json({ loans: rows || [] })
  })
})

router.post("/", (req, res) => {
  const { amount, tenure_months, type = "personal", purpose } = req.body
  if (!amount || !tenure_months) return res.status(400).json({ error: "amount and tenure_months required" })
  const rate = 12.00
  const emi  = Math.round((amount * (1 + rate/100 * tenure_months/12)) / tenure_months)
  db.query(
    "INSERT INTO loans (user_id,type,amount,tenure_months,interest_rate,emi,purpose,status) VALUES (?,?,?,?,?,?,?,'pending')",
    [req.user.id, type, amount, tenure_months, rate, emi, purpose||null],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Server error" })
      res.status(201).json({ id: result.insertId, emi })
    }
  )
})

router.patch("/:id/approve", (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" })
  db.query("UPDATE loans SET status='approved' WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "Server error" })
    res.json({ ok: true })
  })
})

router.patch("/:id/reject", (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" })
  db.query("UPDATE loans SET status='rejected' WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "Server error" })
    res.json({ ok: true })
  })
})

module.exports = router
