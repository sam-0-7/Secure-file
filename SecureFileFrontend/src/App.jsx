import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import Dashboard from "./components/Dashboard";
import AuditLogs from "./components/AuditLogs";

// New CloudPulse-style pages
import OwnerLoginPage from "./components/OwnerLoginPage";
import UserLoginPage from "./components/UserLoginPage";
import ServerLoginPage from "./components/ServerLoginPage";
import ServerHomePage from "./components/ServerHomePage";
import IpfsLoginPage from "./components/IpfsLoginPage";
import OwnerDashboard from "./components/OwnerDashboard";
import UserDownloadPage from "./components/UserDownloadPage";
import NewOwnerPage from "./components/NewOwnerPage";
import NewUserPage from "./components/NewUserPage";

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/owner-login" replace />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />

        {/* Login portals */}
        <Route path="/owner-login"  element={<OwnerLoginPage />} />
        <Route path="/user-login"   element={<UserLoginPage />} />
        <Route path="/server-login" element={<ServerLoginPage />} />
        <Route path="/ipfs-login"   element={<IpfsLoginPage />} />

        {/* Registration */}
        <Route path="/new-owner" element={<NewOwnerPage />} />
        <Route path="/new-user"  element={<NewUserPage />} />

        {/* Legacy routes (keep working) */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected — Server Admin */}
        <Route path="/server-home" element={
          <PrivateRoute><ServerHomePage /></PrivateRoute>
        } />

        {/* Protected — Owner (Admin) */}
        <Route path="/owner-dashboard" element={
          <PrivateRoute><OwnerDashboard /></PrivateRoute>
        } />
        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />
        <Route path="/audit" element={
          <PrivateRoute><AuditLogs /></PrivateRoute>
        } />

        {/* Protected — User */}
        <Route path="/user-download" element={
          <PrivateRoute><UserDownloadPage /></PrivateRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
