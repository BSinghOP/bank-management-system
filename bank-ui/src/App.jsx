import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Loans from "./pages/Loans";
import FDs from "./pages/FixedDeposits";
import Transfer from "./pages/Transfer";
import ChangePassword from "./pages/ChangePassword";
import AdminUsers from "./pages/admin/Users";
import AuditLog from "./pages/admin/AuditLog";
import Reports from "./pages/admin/Reports";
import AddUser from "./pages/admin/AddUser";
import SqlExplorer from "./pages/admin/SqlExplorer";

function Protected({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{padding:40}}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <div style={{padding:40}}>Access Denied</div>;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"       element={<Protected><Layout><Dashboard /></Layout></Protected>} />
          <Route path="/accounts"        element={<Protected><Layout><Accounts /></Layout></Protected>} />
          <Route path="/transactions"    element={<Protected><Layout><Transactions /></Layout></Protected>} />
          <Route path="/loans"           element={<Protected><Layout><Loans /></Layout></Protected>} />
          <Route path="/fixed-deposits"  element={<Protected><Layout><FDs /></Layout></Protected>} />
          <Route path="/transfer"        element={<Protected><Layout><Transfer /></Layout></Protected>} />
          <Route path="/change-password" element={<Protected><Layout><ChangePassword /></Layout></Protected>} />
          <Route path="/admin/users"     element={<Protected role="admin"><Layout><AdminUsers /></Layout></Protected>} />
          <Route path="/admin/audit"     element={<Protected role="admin"><Layout><AuditLog /></Layout></Protected>} />
          <Route path="/admin/add-user"  element={<Protected role="admin"><Layout><AddUser /></Layout></Protected>} />
          <Route path="/admin/reports"   element={<Protected role="admin"><Layout><Reports /></Layout></Protected>} />
          <Route path="/admin/sql"       element={<Protected role="admin"><Layout><SqlExplorer /></Layout></Protected>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
