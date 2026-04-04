const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const db = require("./db");
const admin = require("./middleware/admin");
const app = express();

app.use(express.json());

app.use(cors({
  origin: ["https://dbms.bsingh.codes"],
  credentials: true
}));

const SECRET = "secretkey";


// ========================
// 🔐 AUTH MIDDLEWARE
// ========================
function auth(req, res, next) {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).send("No token");

    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;

    next();
  } catch {
    res.status(401).send("Invalid token");
  }
}

// ========================
// 👑 ADMIN MIDDLEWARE
// ========================
function admin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).send("Access denied");
  }
  next();
}


// ========================
// 🏠 HOME
// ========================
app.get("/", (req, res) => {
  res.send("Bank API running");
});


// ========================
// 👤 REGISTER
// ========================
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (name,email,password,balance,role) VALUES (?,?,?,?,?)",
    [name, email, hashed, 1000, "user"],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Registered");
    }
  );
});


// ========================
// 🔑 LOGIN (PASSWORD)
// ========================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0) return res.send("User not found");

    const user = result[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.send("Wrong password");

    const token = jwt.sign(
      { id: user.id, role: user.role },
      SECRET
    );

    res.json({ token });
  });
});


// ========================
// 📩 SEND OTP
// ========================
app.post("/send-otp", (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000);

  const expiry = new Date(Date.now() + 5 * 60 * 1000);

  db.query(
    "INSERT INTO otp_codes (email, otp, expires_at) VALUES (?, ?, ?)",
    [email, otp, expiry]
  );

  console.log("OTP:", otp);

  res.send("OTP generated");

  // EMAIL (non-blocking)
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "YOUR_EMAIL@gmail.com",
        pass: "YOUR_APP_PASSWORD"
      }
    });

    transporter.sendMail({
      from: "BSingh Bank <YOUR_EMAIL@gmail.com>",
      to: email,
      subject: "Your OTP",
      text: `Your OTP is ${otp}`
    });

  } catch (err) {
    console.log("Email error:", err);
  }
});


// ========================
// ✅ VERIFY OTP
// ========================
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  db.query(
    "SELECT * FROM otp_codes WHERE email=? ORDER BY id DESC LIMIT 1",
    [email],
    (err, result) => {
      if (err) return res.status(500).send(err);
      if (result.length === 0) return res.send("No OTP");

      const record = result[0];

      if (record.otp != otp || new Date() > record.expires_at) {
        return res.status(400).send("Invalid or expired OTP");
      }

      db.query("SELECT * FROM users WHERE email=?", [email], (err, userRes) => {
        if (userRes.length === 0) return res.send("User not found");

        const user = userRes[0];

        const token = jwt.sign(
          { id: user.id, role: user.role },
          SECRET
        );

        res.json({ token });
      });
    }
  );
});


// ========================
// 💰 BALANCE
// ========================
app.get("/balance", auth, (req, res) => {
  db.query(
    "SELECT balance FROM users WHERE id=?",
    [req.user.id],
    (err, result) => {
      if (err) return res.send(err);
      res.json(result[0]);
    }
  );
});


// ========================
// 💸 TRANSFER
// ========================
app.post("/transfer", auth, (req, res) => {
  const { receiverEmail, amount } = req.body;
  const senderId = req.user.id;

  db.beginTransaction(err => {
    if (err) return res.send(err);

    db.query("SELECT * FROM users WHERE email=?", [receiverEmail], (err, receiver) => {
      if (receiver.length === 0)
        return db.rollback(() => res.send("Receiver not found"));

      const receiverId = receiver[0].id;

      db.query("SELECT balance FROM users WHERE id=?", [senderId], (err, sender) => {
        if (sender[0].balance < amount)
          return db.rollback(() => res.send("Insufficient balance"));

        db.query("UPDATE users SET balance = balance - ? WHERE id=?", [amount, senderId]);
        db.query("UPDATE users SET balance = balance + ? WHERE id=?", [amount, receiverId]);

        db.query(
          "INSERT INTO transactions (sender_id, receiver_id, amount) VALUES (?,?,?)",
          [senderId, receiverId, amount]
        );

        db.commit(err => {
          if (err) return db.rollback(() => res.send(err));
          res.send("Transfer successful");
        });
      });
    });
  });
});


// ========================
// 🧾 USER TRANSACTIONS
// ========================
app.get("/transactions", auth, (req, res) => {
  db.query(
    "SELECT * FROM transactions WHERE sender_id=? OR receiver_id=?",
    [req.user.id, req.user.id],
    (err, result) => {
      res.json(result);
    }
  );
});


// ========================
// 🛠 ADMIN ROUTE
// ========================
app.get("/admin/transactions", auth, admin, (req, res) => {
  db.query("SELECT * FROM transactions", (err, result) => {
    res.json(result);
  });
});


// ========================
// 🚀 START SERVER
// ========================
app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});
//something
app.get("/verify-token", (req, res) => {
  try {
    const token = req.headers.authorization;
    jwt.verify(token, SECRET);
    res.send("Valid");
  } catch {
    res.status(401).send("Invalid");
  }
});
