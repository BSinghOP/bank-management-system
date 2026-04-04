import { useState, useEffect } from "react";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  // 🔑 SEND OTP
  const sendOtp = async () => {
    if (!email) {
      alert("Enter email first");
      return;
    }

    try {
      setLoading(true);

      await axios.post("/api/send-otp", { email });

      setStep(2);
      setTimer(30); // ⏱ 30 sec cooldown
    } catch (err) {
      console.error(err);
      alert("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ⏱ TIMER
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer]);

  // ✅ VERIFY OTP
  const verifyOtp = async () => {
    if (!otp) {
      alert("Enter OTP");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("/api/verify-otp", {
        email,
        otp, // ✅ FIXED
      });

      localStorage.setItem("token", res.data.token);

      alert("Login successful");

      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      alert("Invalid OTP ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>BSingh Bank Login</h2>

        {step === 1 && (
          <>
            <input
              style={styles.input}
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              style={styles.button}
              onClick={sendOtp}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              style={styles.input}
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <button
              style={{ ...styles.button, background: "#16a34a" }}
              onClick={verifyOtp}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            {/* 🔁 RESEND LOGIC */}
            {timer > 0 ? (
              <p style={{ fontSize: "12px", color: "gray" }}>
                Resend OTP in {timer}s
              </p>
            ) : (
              <p style={styles.resend} onClick={sendOtp}>
                Resend OTP
              </p>
            )}

            <p style={styles.resend} onClick={() => setStep(1)}>
              Change Email
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// 🎨 STYLES
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
    fontFamily: "Arial",
  },

  card: {
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    width: "320px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    textAlign: "center",
  },

  title: {
    marginBottom: "20px",
    fontWeight: "bold",
  },

  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "15px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },

  button: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },

  resend: {
    marginTop: "10px",
    fontSize: "12px",
    color: "#2563eb",
    cursor: "pointer",
  },
};
