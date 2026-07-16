import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function NewUserPage() {
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
      const data = await registerUser({ ...form, role: "User" });
      setSuccess("User account created! Redirecting…");
      login(data);
      setTimeout(() => navigate("/user-download"), 900);
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
        <span>New User</span>
      </div>
      <div className="cp-section">
        <h1 className="cp-section-title">Register as User</h1>
        <div className="cp-card">
          {error && <div className="cp-alert-error" id="newuser-error">⚠ {error}</div>}
          {success && <div className="cp-alert-success" id="newuser-success">✔ {success}</div>}
          <form onSubmit={handleSubmit} noValidate id="newuser-form">
            <div className="cp-field">
              <label htmlFor="nu-username" className="cp-label">UserName</label>
              <input type="text" id="nu-username" name="username" className="cp-input"
                value={form.username} onChange={handleChange} autoFocus />
            </div>
            <div className="cp-field">
              <label htmlFor="nu-email" className="cp-label">Email Address</label>
              <input type="email" id="nu-email" name="email" className="cp-input"
                value={form.email} onChange={handleChange} />
            </div>
            <div className="cp-field">
              <label htmlFor="nu-password" className="cp-label">Password</label>
              <input type="password" id="nu-password" name="password" className="cp-input"
                value={form.password} onChange={handleChange} />
            </div>
            <button type="submit" className="cp-btn-primary" disabled={loading} id="btn-newuser-submit">
              {loading ? "Creating…" : "SUBMIT"}
            </button>
            <button type="button" className="cp-btn-secondary" onClick={handleReset} id="btn-newuser-reset">
              RESET
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
