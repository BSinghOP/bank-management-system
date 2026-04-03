const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = "secretkey";

// Home route
app.get("/", (req, res) => {
    res.send("Bank API server is running");
});

// Register
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    db.query(
        "INSERT INTO users (name,email,password,balance) VALUES (?,?,?,1000)",
        [name, email, hashed],
        (err) => {
            if (err) return res.send(err);
            res.send("Registered successfully");
        }
    );
});

// Login
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {
        if (err) return res.send(err);
        if (result.length === 0) return res.send("User not found");

        const valid = await bcrypt.compare(password, result[0].password);
        if (!valid) return res.send("Wrong password");

        const token = jwt.sign({ id: result[0].id }, SECRET);
        res.json({ token });
    });
});

// Get balance
app.get("/balance", (req, res) => {
    const token = req.headers["authorization"];
    const decoded = jwt.verify(token, SECRET);

    db.query("SELECT balance FROM users WHERE id=?", [decoded.id], (err, result) => {
        if (err) return res.send(err);
        res.json(result[0]);
    });
});

// Transfer money
app.post("/transfer", (req, res) => {
    const token = req.headers["authorization"];
    const decoded = jwt.verify(token, SECRET);

    const { receiverEmail, amount } = req.body;

    db.query("SELECT * FROM users WHERE email=?", [receiverEmail], (err, receiver) => {

        if (err) return res.send(err);
        if (receiver.length === 0) return res.send("Receiver not found");

        const receiverId = receiver[0].id;

        db.query("SELECT balance FROM users WHERE id=?", [decoded.id], (err, sender) => {

            if (err) return res.send(err);
            if (sender[0].balance < amount) return res.send("Insufficient balance");

            db.query("UPDATE users SET balance = balance - ? WHERE id=?", [amount, decoded.id]);
            db.query("UPDATE users SET balance = balance + ? WHERE id=?", [amount, receiverId]);

            db.query(
                "INSERT INTO transactions (sender_id, receiver_id, amount) VALUES (?,?,?)",
                [decoded.id, receiverId, amount]
            );

            res.send("Transfer successful");
        });

    });
});

app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on port 3000");
});
