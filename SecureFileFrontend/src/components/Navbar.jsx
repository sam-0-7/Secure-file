import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { getSecurityStatus } from "../api/api";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isFullSecurity, setIsFullSecurity] = useState(false);

  useEffect(() => {
    getSecurityStatus()
      .then((data) => {
        if (data?.securityMode === "Full" || data?.SecurityMode === "Full") {
          setIsFullSecurity(true);
        }
      })
      .catch((err) => console.error("Error checking security status:", err));
  }, []);

  function handleLogout() {
    logout();
    navigate("/");
  }

  const isActive = (path) => location.pathname === path;

  return (
    <header className="cl-navbar">
      {/* Logo */}
      <Link to="/" className="cl-logo" id="nav-brand">
        <div className="cl-logo-icon">☁</div>
        <div>
          <h2>Cloud<span>Pulse</span></h2>
        </div>
      </Link>

      {isFullSecurity && (
        <span className="security-badge" id="nav-security-badge">
          🛡️ Full Security Mode
        </span>
      )}

      {/* Nav Links */}
      <nav className="cl-nav-links">
        <Link to="/"           className={`cl-nav-link${isActive("/")             ? " active" : ""}`} id="nav-home">Home</Link>
        <Link to="/server-login" className={`cl-nav-link${isActive("/server-login") ? " active" : ""}`} id="nav-serverlogin">Server Login</Link>
        <Link to="/ipfs-login"   className={`cl-nav-link${isActive("/ipfs-login")   ? " active" : ""}`} id="nav-ipfslogin">IPFS Login</Link>
        <Link to="/owner-login"  className={`cl-nav-link${isActive("/owner-login")  ? " active" : ""}`} id="nav-ownerlogin">Owner Login</Link>
        <Link to="/new-owner"    className={`cl-nav-link${isActive("/new-owner")    ? " active" : ""}`} id="nav-newowner">New Owner</Link>
        <Link to="/user-login"   className={`cl-nav-link${isActive("/user-login")   ? " active" : ""}`} id="nav-userlogin">User Login</Link>

        {/* Authenticated role-specific links */}
        {isAuthenticated && user?.role === "Admin" && (
          <>
            <Link to="/server-home" className={`cl-nav-link${isActive("/server-home") ? " active" : ""}`} id="nav-server-home">Server Home</Link>
            <Link to="/audit"       className={`cl-nav-link${isActive("/audit")       ? " active" : ""}`} id="nav-audit">Audit Logs</Link>
          </>
        )}
        {isAuthenticated && user?.role === "Owner" && (
          <Link to="/owner-dashboard" className={`cl-nav-link${isActive("/owner-dashboard") ? " active" : ""}`} id="nav-owner-dashboard">Owner Panel</Link>
        )}
        {isAuthenticated && user?.role === "User" && (
          <Link to="/user-download" className={`cl-nav-link${isActive("/user-download") ? " active" : ""}`} id="nav-user-download">My Downloads</Link>
        )}
      </nav>

      {/* Right side */}
      {isAuthenticated ? (
        <div className="cl-nav-right">
          <span className="cl-nav-user">
            👤 {user?.username}
            <span className="cl-nav-role">{user?.role}</span>
          </span>
          <button id="btn-logout" className="cl-nav-btn cl-nav-btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
        <Link to="/new-user" className="cl-nav-btn" id="nav-newuser">
          New User
        </Link>
      )}
    </header>
  );
}
