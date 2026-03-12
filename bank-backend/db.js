const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",   // your VPS IP
  user: "BSingh",
  password: "BSingh@123",
  database: "bankdb",
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

module.exports = db;
