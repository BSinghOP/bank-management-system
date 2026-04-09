require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const bcrypt     = require("bcrypt");
const jwt        = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const helmet     = require("helmet");
const rateLimit  = require("express-rate-limit");
const crypto     = require("crypto");
const db         = require("./db");

const authMiddleware  = require("./middleware/auth");
const adminMiddleware = require("./middleware/admin");

// ── New route modules ────────────────────────────────────────────
const accountRoutes     = require("./routes/accounts");
const transactionRoutes = require("./routes/transactions");
const loanRoutes        = require("./routes/loans");
const fdRoutes          = require("./routes/fixedDeposits");
const adminRoutes       = require("./routes/admin");
const dashboardRoutes   = require("./routes/dashboard");

const app = express();

app.set("trust proxy", 1); // Cloudflare + Nginx

// ── Security headers ─────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // handled by Nginx
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));
app.disable("x-powered-by");

// ── CORS ─────────────────────────────────────────────────────────
app.use(cors({
  origin: ["https://dbms.bsingh.codes"],
  credentials: true,
}));

// ── Body parsing (limit size to prevent attacks) ──────────────────
app.use(express.json({ limit: "10kb" }));

// ── Rate limiters ─────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  message: { error: "Too many requests. Try again later." },
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { error: "Too many login attempts. Wait 15 minutes." },
});
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, max: 5,
  message: { error: "Too many OTP attempts." },
});

app.use(globalLimiter);

const SECRET         = process.env.JWT_SECRET         || "secretkey";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refreshsecret";

// ========================
// 🏠 HOME / HEALTH
// ========================
app.get("/", (req, res) => res.send("Bank API running"));
app.get("/api/health", (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ========================
// 👤 REGISTER
// ========================
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    const hashed = await bcrypt.hash(password, 12); // upgraded from 10 → 12

    db.query(
      "INSERT INTO users (name,email,password,balance,role) VALUES (?,?,?,?,?)",
      [name, email.toLowerCase().trim(), hashed, 1000, "user"],
      (err) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY")
            return res.status(409).json({ error: "Email already registered" });
          return res.status(500).json({ error: "Registration failed" });
        }
        res.json({ message: "Registered successfully" });
      }
    );
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ========================
// 🔑 LOGIN (unchanged flow, just hardened)
// ========================
app.post("/login", loginLimiter, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  db.query("SELECT * FROM users WHERE email=?", [email.toLowerCase().trim()], async (err, result) => {
    if (err) return res.status(500).json({ error: "Server error" });
    if (result.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = result[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: "1d" });
    res.json({ token });
  });
});

// ========================
// 📩 SEND OTP  (now hashes OTP before storing)
// ========================
app.post("/send-otp", loginLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const otp     = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  const expiry  = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  // Delete old OTPs for this email first
  db.query("DELETE FROM otp_codes WHERE email=?", [email]);

  db.query(
    "INSERT INTO otp_codes (email, otp, expires_at) VALUES (?, ?, ?)",
    [email, otpHash, expiry]
  );

  res.json({ message: "OTP sent" }); // respond before email so UI isn't slow

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER || "bibekpreetsingh15@gmail.com",
        pass: process.env.SMTP_PASS || "scmvoafiukklsfnj",
      },
    });

    await transporter.sendMail({
      from: `BSingh Bank <${process.env.SMTP_USER || "bibekpreetsingh15@gmail.com"}>`,
      to: email,
      subject: `${otp} — Your Login OTP`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <div style="background:#0f4c81;padding:20px 24px;border-radius:8px 8px 0 0">
            <span style="color:white;font-size:18px;font-weight:600">BSingh Bank</span>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
            <p style="color:#374151;font-size:15px">Your one-time login code:</p>
            <div style="background:#f0f7ff;border:2px dashed #bfdbfe;border-radius:8px;padding:20px;text-align:center;margin:16px 0">
              <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#0f4c81;font-family:monospace">${otp}</span>
            </div>
            <p style="color:#6b7280;font-size:13px">Expires in <strong>10 minutes</strong>. Never share this code.</p>
          </div>
        </div>`,
    });
  } catch (err) {
    console.error("Email error:", err.message);
  }
});

// ========================
// ✅ VERIFY OTP  (now compares hashed OTP)
// ========================
app.post("/verify-otp", otpLimiter, (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });

  const otpHash = crypto.createHash("sha256").update(String(otp)).digest("hex");

  db.query(
    "SELECT * FROM otp_codes WHERE email=? ORDER BY id DESC LIMIT 1",
    [email],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Server error" });
      if (result.length === 0) return res.status(400).json({ error: "No OTP found" });

      const record = result[0];

      if (record.otp !== otpHash || new Date() > record.expires_at) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // Single-use — delete immediately
      db.query("DELETE FROM otp_codes WHERE email=?", [email]);

      db.query("SELECT * FROM users WHERE email=?", [email], (err, userRes) => {
        if (err || userRes.length === 0)
          return res.status(404).json({ error: "User not found" });

        const user = userRes[0];
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: "1d" });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
      });
    }
  );
});

// ========================
// 🔐 VERIFY TOKEN
// ========================
app.get("/verify-token", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const payload = jwt.verify(token, SECRET);
    res.json({ valid: true, user: payload });
  } catch {
    res.status(401).json({ valid: false, error: "Invalid token" });
  }
});

// ========================
// 💰 BALANCE
// ========================
app.get("/balance", authMiddleware, (req, res) => {
  db.query("SELECT balance FROM users WHERE id=?", [req.user.id], (err, result) => {
    if (err) return res.status(500).json({ error: "Server error" });
    res.json(result[0]);
  });
});

// ========================
// 💸 TRANSFER
// ========================
app.post("/transfer", authMiddleware, (req, res) => {
  const { receiverEmail, amount } = req.body;
  const senderId = req.user.id;

  if (!receiverEmail || !amount || amount <= 0)
    return res.status(400).json({ error: "Invalid transfer details" });

  db.beginTransaction(err => {
    if (err) return res.status(500).json({ error: "Transaction error" });

    db.query("SELECT * FROM users WHERE email=?", [receiverEmail], (err, receiver) => {
      if (err || receiver.length === 0)
        return db.rollback(() => res.status(404).json({ error: "Receiver not found" }));

      const receiverId = receiver[0].id;
      if (receiverId === senderId)
        return db.rollback(() => res.status(400).json({ error: "Cannot transfer to yourself" }));

      db.query("SELECT balance FROM users WHERE id=?", [senderId], (err, sender) => {
        if (err || sender[0].balance < amount)
          return db.rollback(() => res.status(400).json({ error: "Insufficient balance" }));

        db.query("UPDATE users SET balance = balance - ? WHERE id=?", [amount, senderId], (err) => {
          if (err) return db.rollback(() => res.status(500).json({ error: "Transfer failed" }));

          db.query("UPDATE users SET balance = balance + ? WHERE id=?", [amount, receiverId], (err) => {
            if (err) return db.rollback(() => res.status(500).json({ error: "Transfer failed" }));

            db.query(
              "INSERT INTO transactions (sender_id, receiver_id, amount) VALUES (?,?,?)",
              [senderId, receiverId, amount],
              (err) => {
                if (err) return db.rollback(() => res.status(500).json({ error: "Transfer failed" }));
                db.commit(err => {
                  if (err) return db.rollback(() => res.status(500).json({ error: "Commit failed" }));
                  res.json({ message: "Transfer successful" });
                });
              }
            );
          });
        });
      });
    });
  });
});

// ========================
// 🧾 USER TRANSACTIONS
// ========================
app.get("/transactions", authMiddleware, (req, res) => {
  db.query(
    "SELECT * FROM transactions WHERE sender_id=? OR receiver_id=? ORDER BY id DESC",
    [req.user.id, req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Server error" });
      res.json(result);
    }
  );
});

// ========================
// 👑 EXISTING ADMIN ROUTE
// ========================
app.get("/admin/transactions", authMiddleware, adminMiddleware, (req, res) => {
  db.query("SELECT * FROM transactions ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).json({ error: "Server error" });
    res.json(result);
  });
});

// ========================
// 🆕 NEW API ROUTES
// ========================
app.use("/api/dashboard",      authMiddleware, dashboardRoutes);
app.use("/api/accounts",       authMiddleware, accountRoutes);
app.use("/api/transactions",   authMiddleware, transactionRoutes);
app.use("/api/loans",          authMiddleware, loanRoutes);
app.use("/api/fixed-deposits", authMiddleware, fdRoutes);
app.use("/api/admin",          authMiddleware, adminMiddleware, adminRoutes);

// ========================
// 🚀 START SERVER
// ========================
app.listen(3000, "0.0.0.0", () => {
  console.log("✓ Server running on port 3000");
});

// ========================
// 🔑 CHANGE PASSWORD
// ========================
app.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: "Both fields required" })
    if (newPassword.length < 6)
      return res.status(400).json({ error: "New password must be at least 6 characters" })

    db.query("SELECT password FROM users WHERE id=?", [req.user.id], async (err, rows) => {
      if (err || !rows.length) return res.status(500).json({ error: "Server error" })

      const valid = await bcrypt.compare(currentPassword, rows[0].password)
      if (!valid) return res.status(401).json({ error: "Current password is incorrect" })

      const hash = await bcrypt.hash(newPassword, 12)
      db.query("UPDATE users SET password=? WHERE id=?", [hash, req.user.id], (err2) => {
        if (err2) return res.status(500).json({ error: "Server error" })
        res.json({ ok: true, message: "Password changed successfully" })
      })
    })
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})
