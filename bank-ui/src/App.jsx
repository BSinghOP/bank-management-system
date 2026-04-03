import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const API = "/api";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [page, setPage] = useState("dashboard");
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");

  const login = async () => {
    const res = await fetch(API + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
    } else alert("Login failed");
  };

  const getBalance = async () => {
    const res = await fetch(API + "/balance", {
      headers: { Authorization: token },
    });
    const data = await res.json();
    setBalance(data.balance);
  };

  const getTransactions = async () => {
    const res = await fetch(API + "/transactions", {
      headers: { Authorization: token },
    });
    const data = await res.json();
    setTransactions(data);
  };

  const transfer = async () => {
    const res = await fetch(API + "/transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ receiverEmail: receiver, amount }),
    });

    alert(await res.text());
    getBalance();
    getTransactions();
  };

  useEffect(() => {
    if (token) {
      getBalance();
      getTransactions();
    }
  }, [token]);

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white text-black p-8 rounded-2xl w-96 shadow-xl">
          <h2 className="text-2xl font-bold mb-2">BSingh's Bank</h2>
          <p className="text-gray-500 mb-4">Secure Banking Login</p>

          <input placeholder="Email" className="w-full p-3 mb-3 border rounded-lg" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full p-3 mb-4 border rounded-lg" onChange={(e) => setPassword(e.target.value)} />

          <button onClick={login} className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition">Login</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold mb-6">🏦 BSingh's Bank</h2>
          <nav className="flex flex-col gap-3">
            <button onClick={() => setPage("dashboard")} className="text-left hover:text-blue-600">Dashboard</button>
            <button onClick={() => setPage("transfer")} className="text-left hover:text-blue-600">Transfer</button>
            <button onClick={() => setPage("transactions")} className="text-left hover:text-blue-600">Transactions</button>
          </nav>
        </div>
        <button onClick={logout} className="text-red-500">Logout</button>
      </div>

      {/* Main */}
      <div className="flex-1 p-8 overflow-auto">
        {page === "dashboard" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow">
                <h3 className="text-gray-500">Account Balance</h3>
                <p className="text-3xl font-bold mt-2">₹{balance}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow">
                <h3 className="text-gray-500">Quick Transfer</h3>
                <button onClick={() => setPage("transfer")} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">Send Money</button>
              </div>
            </div>
          </motion.div>
        )}

        {page === "transfer" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-2xl font-bold mb-4">Transfer Money</h1>

            <div className="bg-white p-6 rounded-2xl shadow max-w-md">
              <input placeholder="Receiver Email" className="w-full p-3 mb-3 border rounded-lg" onChange={(e) => setReceiver(e.target.value)} />
              <input placeholder="Amount" className="w-full p-3 mb-4 border rounded-lg" onChange={(e) => setAmount(e.target.value)} />
              <button onClick={transfer} className="w-full bg-blue-600 text-white p-3 rounded-lg">Send</button>
            </div>
          </motion.div>
        )}

        {page === "transactions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-2xl font-bold mb-4">Transactions</h1>

            <div className="bg-white p-6 rounded-2xl shadow">
              {transactions.map((t) => (
                <div key={t.id} className="flex justify-between border-b py-2">
                  <span>₹{t.amount}</span>
                  <span className="text-gray-500">ID: {t.id}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}


