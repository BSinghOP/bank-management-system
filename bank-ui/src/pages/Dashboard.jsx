import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Dashboard() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // 🔐 AUTH CHECK + DATA LOAD
  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    // ✅ verify token with backend
    axios
      .get("/api/verify-token", {
        headers: { Authorization: token },
      })
      .then(() => {
        // ✅ fetch data only if token valid
        loadData();
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/");
      });
  }, []);

  // 📊 LOAD DATA
  const loadData = () => {
    axios
      .get("/api/balance", {
        headers: { Authorization: token },
      })
      .then((res) => setBalance(res.data.balance));

    axios
      .get("/api/transactions", {
        headers: { Authorization: token },
      })
      .then((res) => setTransactions(res.data));
  };

  // 🚪 LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div style={styles.container}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <h2>BSingh Bank</h2>

        <p onClick={() => navigate("/dashboard")}>Dashboard</p>
        <p onClick={() => navigate("/transfer")}>Transfer</p>
        <p onClick={() => navigate("/dashboard")}>Transactions</p>

        <p onClick={logout} style={{ marginTop: "20px", color: "red" }}>
          Logout
        </p>
      </div>

      {/* MAIN */}
      <div style={styles.main}>
        <h1>Welcome 👋</h1>

        {/* 💳 BALANCE */}
        <div style={styles.card}>
          <h3>Current Balance</h3>
          <h1>₹{balance}</h1>
        </div>

        {/* 🔘 ACTIONS */}
        <div style={styles.actions}>
          <button
            style={styles.actionBtn}
            onClick={() => navigate("/transfer")}
          >
            Send Money
          </button>

          <button
            style={styles.actionBtn}
            onClick={() => alert("Coming soon")}
          >
            Add Money
          </button>

          <button
            style={styles.actionBtn}
            onClick={loadData}
          >
            Refresh
          </button>
        </div>

        {/* 🧾 TRANSACTIONS */}
        <div style={styles.tableBox}>
          <h3>Recent Transactions</h3>

          <table style={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.sender_id}</td>
                  <td>{t.receiver_id}</td>
                  <td style={{ color: "green", fontWeight: "bold" }}>
                    ₹{t.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 🎨 STYLES
const styles = {
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "Arial",
    background: "#f4f6f9",
  },

  sidebar: {
    width: "220px",
    background: "#1e3a8a",
    color: "white",
    padding: "20px",
    cursor: "pointer",
  },

  main: {
    flex: 1,
    padding: "20px",
  },

  card: {
    background: "linear-gradient(135deg, #2563eb, #1e40af)",
    color: "white",
    padding: "25px",
    borderRadius: "12px",
    marginBottom: "20px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
  },

  actions: {
    display: "flex",
    gap: "15px",
    marginBottom: "20px",
  },

  actionBtn: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },

  tableBox: {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
  },
};
