import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function OwnerLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "", loginKey: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username || !form.password || !form.loginKey) {
      setError("Please fill in all fields including the Login Key.");
      return;
    }
    setLoading(true);
    try {
      const data = await loginUser(form);
      if (data.role !== "Owner") {
        setError("Access denied. This portal is for owners only.");
        return;
      }
      login(data);
      navigate("/owner-dashboard");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cp-page">
      <div className="cp-breadcrumb">
        <Link to="/">HOME</Link>
        <span> / </span>
        <span>Owner</span>
      </div>
      <div className="cp-section">
        <h1 className="cp-section-title">Owner Login Here..!</h1>
        <div className="cp-card">
          {error && <div className="cp-alert-error" id="owner-login-error">⚠ {error}</div>}
          <form onSubmit={handleSubmit} id="owner-login-form" noValidate>
            <div className="cp-field">
              <label htmlFor="owner-username" className="cp-label">UserName</label>
              <input type="text" id="owner-username" name="username" className="cp-input"
                placeholder="mark" value={form.username} onChange={handleChange}
                autoFocus autoComplete="username" />
            </div>
            <div className="cp-field">
              <label htmlFor="owner-password" className="cp-label">Password</label>
              <input type="password" id="owner-password" name="password" className="cp-input"
                placeholder="••••••••" value={form.password} onChange={handleChange}
                autoComplete="current-password" />
            </div>
            <div className="cp-field">
              <label htmlFor="owner-loginkey" className="cp-label">Login Key</label>
              <input type="text" id="owner-loginkey" name="loginKey" className="cp-input"
                placeholder="e.g. 3751 (sent to your email by admin)"
                value={form.loginKey} onChange={handleChange}
                maxLength={8} />
            </div>
            <button type="submit" className="cp-btn-primary" disabled={loading} id="btn-owner-login">
              {loading ? "Logging in…" : "SUBMIT"}
            </button>
            <button type="button" className="cp-btn-secondary"
              onClick={() => { setForm({ username: "", password: "", loginKey: "" }); setError(""); }}
              id="btn-owner-reset">
              RESET
            </button>
          </form>
          <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#8a9bb0" }}>
            Sample: <strong>mark</strong> / <strong>mark</strong> / key <strong>3751</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
