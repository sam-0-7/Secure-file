import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function ServerLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username || !form.password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const data = await loginUser(form);
      if (data.role !== "Admin") {
        setError("Access denied. This portal is for server admins only.");
        return;
      }
      login(data);
      navigate("/server-home");
    } catch (err) {
      setError(err.message || "Server login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cp-page">
      <div className="cp-breadcrumb">
        <Link to="/">HOME</Link>
        <span> / </span>
        <span>Server</span>
      </div>
      <div className="cp-section">
        <h1 className="cp-section-title">Server Login Here..!</h1>
        <div className="cp-card">
          {error && <div className="cp-alert-error" id="server-login-error">⚠ {error}</div>}
          <form onSubmit={handleSubmit} id="server-login-form" noValidate>
            <div className="cp-field">
              <label htmlFor="server-username" className="cp-label">Server Username</label>
              <input type="text" id="server-username" name="username" className="cp-input"
                placeholder="admin" value={form.username} onChange={handleChange} autoFocus />
            </div>
            <div className="cp-field">
              <label htmlFor="server-password" className="cp-label">Password</label>
              <input type="password" id="server-password" name="password" className="cp-input"
                placeholder="••••••••" value={form.password} onChange={handleChange} />
            </div>
            <button type="submit" className="cp-btn-primary" disabled={loading} id="btn-server-login">
              {loading ? "Connecting…" : "SUBMIT"}
            </button>
            <button type="button" className="cp-btn-secondary"
              onClick={() => { setForm({ username: "", password: "" }); setError(""); }}
              id="btn-server-reset">
              RESET
            </button>
          </form>
          <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#8a9bb0" }}>
            Default: username <strong>admin</strong> / password <strong>Admin@123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
