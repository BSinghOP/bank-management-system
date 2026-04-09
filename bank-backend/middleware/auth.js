const jwt = require("jsonwebtoken")
const db  = require("../db")
const SECRET = process.env.JWT_SECRET || "secretkey"

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) return res.status(401).json({ error: "Not authenticated" })

  try {
    const payload = jwt.verify(token, SECRET)
    const userId = payload.id || payload.userId

    db.query(
      "SELECT id, name, email, role, status FROM users WHERE id = ?",
      [userId],
      (err, rows) => {
        if (err) return res.status(500).json({ error: "Server error" })
        if (!rows.length) return res.status(401).json({ error: "Not authenticated" })

        const user = rows[0]

        if (user.status === "frozen")
          return res.status(403).json({ error: "Your account is frozen. Contact the bank." })

        req.user = { ...payload, ...user }
        next()
      }
    )
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ error: "Session expired" })
    return res.status(401).json({ error: "Invalid token" })
  }
}
