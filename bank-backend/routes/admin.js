const express = require("express");
const router  = express.Router();
const db      = require("../db");

// GET /api/admin/users
router.get("/users", (req, res) => {
  db.query(
    `SELECT u.id, u.name, u.email, u.role, u.balance,
            (SELECT COUNT(*) FROM users WHERE id = u.id) AS account_count,
            NULL AS last_login, 1 AS active, 'verified' AS kyc_status
     FROM users u ORDER BY u.id DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Server error" })
      res.json({ users: rows || [] })
    }
  )
})

// POST /api/admin/users/create
router.post("/users/create", (req, res) => {
  const bcrypt = require("bcrypt")
  const { name, email, password, role = "user", balance = 1000 } = req.body
  if (!name || !email || !password)
    return res.status(400).json({ error: "Name, email and password required" })
  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" })

  bcrypt.hash(password, 12).then(hash => {
    const safeEmail = email.toLowerCase().trim()
    const query = `INSERT INTO users (name, email, password, balance, role)\nVALUES (\n  '${name}',\n  '${safeEmail}',\n  '[bcrypt hash — never stored in plain text]',\n  ${balance},\n  '${role}'\n);`

    db.query(
      "INSERT INTO users (name, email, password, balance, role) VALUES (?,?,?,?,?)",
      [name, safeEmail, hash, balance, role],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY")
            return res.status(409).json({ error: "Email already registered" })
          return res.status(500).json({ error: "Server error" })
        }
        res.status(201).json({ id: result.insertId, name, email: safeEmail, role, balance: Number(balance), query })
      }
    )
  })
})

// PATCH /api/admin/users/:id/role
router.patch("/users/:id/role", (req, res) => {
  const { role } = req.body
  if (!["user","admin"].includes(role))
    return res.status(400).json({ error: "Invalid role" })
  db.query("UPDATE users SET role=? WHERE id=?", [role, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "Server error" })
    res.json({ ok: true })
  })
})

// PATCH /api/admin/users/:id/kyc
router.patch("/users/:id/kyc", (req, res) => {
  res.json({ ok: true })
})

// PATCH /api/admin/users/:id/status
router.patch("/users/:id/status", (req, res) => {
  if (Number(req.params.id) === req.user.id)
    return res.status(400).json({ error: "Cannot deactivate yourself" })
  res.json({ ok: true })
})

// GET /api/admin/audit
router.get("/audit", (req, res) => {
  db.query(
    `SELECT t.id, s.name AS user_name, s.email AS user_email,
       'transfer' AS event, '127.0.0.1' AS ip_address,
       CONCAT('₹', t.amount, ' → ', r.name) AS details,
       200 AS status_code, t.created_at
     FROM transactions t
     LEFT JOIN users s ON t.sender_id   = s.id
     LEFT JOIN users r ON t.receiver_id = r.id
     ORDER BY t.id DESC LIMIT 100`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Server error" })
      res.json({ logs: rows || [], total: rows?.length || 0 })
    }
  )
})

// GET /api/admin/reports/summary
router.get("/reports/summary", (req, res) => {
  const results = {}
  let done = 0
  const finish = () => {
    if (++done < 4) return
    res.json({
      total_users:     results.users,
      active_accounts: results.users,
      total_deposits:  results.balance,
      total_loans:     results.loans || 0,
      total_fds:       results.fds || 0,
      txs_today:       results.txns || 0,
    })
  }
  db.query("SELECT COUNT(*) AS v FROM users",                  (e,r) => { results.users   = r?.[0]?.v || 0; finish() })
  db.query("SELECT COALESCE(SUM(balance),0) AS v FROM users", (e,r) => { results.balance  = r?.[0]?.v || 0; finish() })
  db.query("SELECT COALESCE(SUM(amount),0) AS v FROM loans WHERE status='approved'", (e,r) => { results.loans = r?.[0]?.v || 0; finish() })
  db.query("SELECT COALESCE(SUM(principal),0) AS v FROM fixed_deposits WHERE status='active'", (e,r) => { results.fds = r?.[0]?.v || 0; finish() })
})

module.exports = router

// POST /api/admin/sql — SQL Explorer (admin only, SELECT only)
router.post("/sql", (req, res) => {
  const { sql } = req.body
  if (!sql) return res.status(400).json({ error: "No query provided" })

  // Security: only allow SELECT statements
  const clean = sql.trim().toUpperCase()
  if (!clean.startsWith("SELECT") && !clean.startsWith("SHOW") && !clean.startsWith("DESCRIBE")) {
    return res.status(403).json({ error: "Only SELECT, SHOW, and DESCRIBE queries are allowed" })
  }
  // Block dangerous keywords
  const blocked = ["DROP","DELETE","UPDATE","INSERT","ALTER","CREATE","TRUNCATE","GRANT","REVOKE"]
  if (blocked.some(k => clean.includes(k))) {
    return res.status(403).json({ error: "Query contains blocked keywords" })
  }

  db.query(sql, (err, rows) => {
    if (err) return res.status(400).json({ error: err.message })
    res.json({ rows: Array.isArray(rows) ? rows : [rows] })
  })
})
