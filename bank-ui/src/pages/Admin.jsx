import { useEffect, useState } from "react";
import axios from "axios";

export default function Admin() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    axios.get("/api/admin/transactions")
      .then(res => setTransactions(res.data))
      .catch(err => console.log(err));
  }, []);

  return (
    <div style={styles.container}>
      
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2 style={{ marginBottom: "30px" }}>BSingh Bank</h2>
        <p style={styles.menu}>Dashboard</p>
        <p style={styles.menu}>Transactions</p>
        <p style={styles.menu}>Users</p>
        <p style={styles.menu}>Settings</p>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        <h1 style={{ marginBottom: "20px" }}>Admin Dashboard</h1>

        {/* Cards */}
        <div style={styles.cards}>
          <div style={styles.card}>
            <h3>Total Transactions</h3>
            <h2>{transactions.length}</h2>
          </div>

          <div style={styles.card}>
            <h3>Total Volume</h3>
            <h2>
              ₹{transactions.reduce((sum, t) => sum + t.amount, 0)}
            </h2>
          </div>
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          <h2>Transaction Logs</h2>

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
    background: "#f4f6f9"
  },

  sidebar: {
    width: "220px",
    background: "#1e3a8a",
    color: "white",
    padding: "20px"
  },

  menu: {
    margin: "15px 0",
    cursor: "pointer"
  },

  main: {
    flex: 1,
    padding: "20px"
  },

  cards: {
    display: "flex",
    gap: "20px",
    marginBottom: "20px"
  },

  card: {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    flex: 1
  },

  tableContainer: {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px"
  }
};
