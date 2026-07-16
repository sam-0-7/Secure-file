import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function UserLoginPage() {
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
      login(data);
      navigate("/user-download");
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
      </div>
      <div className="cp-section">
        <h1 className="cp-section-title">User Login Here..!</h1>
        <div className="cp-card">
          {error && <div className="cp-alert-error" id="user-login-error">⚠ {error}</div>}
          <form onSubmit={handleSubmit} id="user-login-form" noValidate>
            <div className="cp-field">
              <label htmlFor="user-username" className="cp-label">UserName</label>
              <input type="text" id="user-username" name="username" className="cp-input"
                value={form.username} onChange={handleChange} autoFocus autoComplete="username" />
            </div>
            <div className="cp-field">
              <label htmlFor="user-password" className="cp-label">Password</label>
              <input type="password" id="user-password" name="password" className="cp-input"
                value={form.password} onChange={handleChange} autoComplete="current-password" />
            </div>
            <button type="submit" className="cp-btn-primary" disabled={loading} id="btn-user-login">
              {loading ? "Logging in…" : "SUBMIT"}
            </button>
            <button type="button" className="cp-btn-secondary"
              onClick={() => { setForm({ username: "", password: "" }); setError(""); }}
              id="btn-user-reset">
              RESET
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
