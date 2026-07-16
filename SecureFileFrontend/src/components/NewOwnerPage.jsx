import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function NewOwnerPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
    setSuccess("");
  }

  function validate() {
    if (!form.username || form.username.length < 3)
      return "Username must be at least 3 characters.";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Please enter a valid email address.";
    if (!form.password || form.password.length < 6)
      return "Password must be at least 6 characters.";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      const data = await registerUser({ ...form, role: "Admin" });
      setSuccess("Owner account created! Redirecting…");
      login(data);
      setTimeout(() => navigate("/owner-dashboard"), 900);
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setForm({ username: "", email: "", password: "" });
    setError("");
    setSuccess("");
  }

  return (
    <div className="cp-page">
      <div className="cp-breadcrumb">
        <Link to="/">HOME</Link>
        <span> / </span>
        <span>New Owner</span>
      </div>
      <div className="cp-section">
        <h1 className="cp-section-title">Register as Owner</h1>
        <div className="cp-card">
          {error && <div className="cp-alert-error" id="newowner-error">⚠ {error}</div>}
          {success && <div className="cp-alert-success" id="newowner-success">✔ {success}</div>}
          <form onSubmit={handleSubmit} noValidate id="newowner-form">
            <div className="cp-field">
              <label htmlFor="no-username" className="cp-label">UserName</label>
              <input type="text" id="no-username" name="username" className="cp-input"
                value={form.username} onChange={handleChange} autoFocus />
            </div>
            <div className="cp-field">
              <label htmlFor="no-email" className="cp-label">Email Address</label>
              <input type="email" id="no-email" name="email" className="cp-input"
                value={form.email} onChange={handleChange} />
            </div>
            <div className="cp-field">
              <label htmlFor="no-password" className="cp-label">Password</label>
              <input type="password" id="no-password" name="password" className="cp-input"
                value={form.password} onChange={handleChange} />
            </div>
            <button type="submit" className="cp-btn-primary" disabled={loading} id="btn-newowner-submit">
              {loading ? "Creating…" : "SUBMIT"}
            </button>
            <button type="button" className="cp-btn-secondary" onClick={handleReset} id="btn-newowner-reset">
              RESET
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
