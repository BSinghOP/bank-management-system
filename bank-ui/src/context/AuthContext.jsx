import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthCtx = createContext(null);

const api = axios.create({ baseURL: "/", timeout: 15000 });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export { api };

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    try {
      const res = await api.get("/verify-token");
      if (res.data.valid) {
        const saved = localStorage.getItem("user");
        setUser(saved ? JSON.parse(saved) : res.data.user);
      } else {
        localStorage.removeItem("token");
      }
    } catch {
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const sendOtp = async (email, password) => {
    const res = await api.post("/login", { email, password });
    if (!res.data.token) throw new Error("Invalid credentials");
    sessionStorage.setItem("otp_email", email);
    await api.post("/send-otp", { email });
    return { requiresOtp: true };
  };

  const verifyOtp = async (otp) => {
    const email = sessionStorage.getItem("otp_email");
    if (!email) throw new Error("Session expired. Please log in again.");
    const res = await api.post("/verify-otp", { email, otp });
    const { token, user: userData } = res.data;
    localStorage.setItem("token", token);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    } else {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const u = { id: payload.id, role: payload.role, email };
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);
    }
    sessionStorage.removeItem("otp_email");
    navigate("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("otp_email");
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthCtx.Provider value={{ user, loading, sendOtp, verifyOtp, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
