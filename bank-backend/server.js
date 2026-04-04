const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
app.use(express.json());

// 🔐 CORS (allow your domain)
app.use(cors({
    origin: ["https://dbms.bsingh.codes"],
    credentials: true
}));

const SECRET = "secretkey";

// 🔑 OTP store (temporary memory)
const otpStore = {};

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
// 🏠 HOME
// ========================
app.get("/", (req, res) => {
    res.send("Bank API server is running");
});

// ========================
// 👤 REGISTER
// ========================
app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashed = await bcrypt.hash(password, 10);

        db.query(
            "INSERT INTO users (name,email,password,balance) VALUES (?,?,?,1000)",
            [name, email, hashed],
            (err) => {
                if (err) return res.status(500).send(err);
                res.send("Registered successfully");
            }
        );
    } catch (err) {
        res.status(500).send(err);
    }
});

// ========================
// 🔑 LOGIN (PASSWORD)
// ========================
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.length === 0) return res.send("User not found");

        const valid = await bcrypt.compare(password, result[0].password);
        if (!valid) return res.send("Wrong password");

        const token = jwt.sign({ id: result[0].id }, SECRET);
        res.json({ token });
    });
});

// ========================
// 📩 SEND OTP
// ========================
const nodemailer = require("nodemailer");

app.post("/send-otp", async (req, res) => {
    const { email } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = otp;

    console.log("OTP:", otp);

    // ✅ Respond immediately (VERY IMPORTANT)
    res.send("OTP generated");

    // 🔥 Send email in background (non-blocking)
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "bibekpreetsingh15@gmail.com",
                pass: "scmv oafi ukkl sfnj"
            }
        });

        await transporter.sendMail({
            from: "BSingh Bank <YOUR_EMAIL@gmail.com>",
            to: email,
            subject: "Your OTP - BSingh Bank",
            text: `Your OTP is: ${otp}`
        });

        console.log("Email sent successfully");
    } catch (err) {
        console.error("Email error:", err);
    }
});
//VERIFY OTP
// ========================
app.post("/verify-otp", (req, res) => {
    const { email, otp } = req.body;

    if (otpStore[email] == otp) {
        db.query("SELECT * FROM users WHERE email=?", [email], (err, result) => {
            if (err) return res.status(500).send(err);
            if (result.length === 0) return res.send("User not found");

            const token = jwt.sign({ id: result[0].id }, SECRET);
            res.json({ token });
        });
    } else {
        res.status(400).send("Invalid OTP");
    }
});

// ========================
// 💰 GET BALANCE
// ========================
app.get("/balance", auth, (req, res) => {
    db.query(
        "SELECT balance FROM users WHERE id=?",
        [req.user.id],
        (err, result) => {
            if (err) return res.status(500).send(err);
            res.json(result[0]);
        }
    );
});

// ========================
// 💸 TRANSFER MONEY (SAFE)
// ========================
app.post("/transfer", auth, (req, res) => {
    const { receiverEmail, amount } = req.body;
    const senderId = req.user.id;

    db.beginTransaction(err => {
        if (err) return res.status(500).send(err);

        db.query("SELECT * FROM users WHERE email=?", [receiverEmail], (err, receiver) => {
            if (err || receiver.length === 0)
                return db.rollback(() => res.send("Receiver not found"));

            const receiverId = receiver[0].id;

            db.query("SELECT balance FROM users WHERE id=?", [senderId], (err, sender) => {
                if (err || sender[0].balance < amount)
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
        "SELECT * FROM transactions WHERE sender_id=? OR receiver_id=? ORDER BY id DESC",
        [req.user.id, req.user.id],
        (err, result) => {
            if (err) return res.status(500).send(err);
            res.json(result);
        }
    );
});

// ========================
// 🛠 ADMIN TRANSACTIONS
// ========================
app.get("/admin/transactions", (req, res) => {
    db.query(
        "SELECT * FROM transactions ORDER BY id DESC",
        (err, result) => {
            if (err) return res.status(500).send(err);
            res.json(result);
        }
    );
});

// ========================
// 🚀 START SERVER
// ========================
app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on port 3000");
});
