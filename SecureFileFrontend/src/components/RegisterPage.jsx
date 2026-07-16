import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", email: "", password: "", role: "User" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
      const data = await registerUser(form);
      setSuccess("Account created! Redirecting…");
      login(data);
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="glass-card auth-card" style={{ maxWidth: 480 }}>
        {/* Header */}
        <div className="text-center mb-4">
          <div className="auth-logo">🚀</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join SecureFile — encrypt &amp; share files safely</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert-dark-danger mb-3" role="alert" id="register-error">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="alert-dark-success mb-3" role="status" id="register-success">
            ✅ {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate id="register-form">
          <div className="mb-3">
            <label htmlFor="reg-username" className="form-label-light">
              Username
            </label>
            <input
              type="text"
              id="reg-username"
              name="username"
              className="form-control form-control-dark"
              placeholder="Choose a username (min 3 chars)"
              value={form.username}
              onChange={handleChange}
              autoFocus
            />
          </div>

          <div className="mb-3">
            <label htmlFor="reg-email" className="form-label-light">
              Email Address
            </label>
            <input
              type="email"
              id="reg-email"
              name="email"
              className="form-control form-control-dark"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="reg-password" className="form-label-light">
              Password
            </label>
            <input
              type="password"
              id="reg-password"
              name="password"
              className="form-control form-control-dark"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="reg-role" className="form-label-light">
              Role
            </label>
            <select
              id="reg-role"
              name="role"
              className="form-control form-control-dark"
              value={form.role}
              onChange={handleChange}
              style={{ cursor: "pointer" }}
            >
              <option value="User">Standard User (Download Only)</option>
              <option value="Admin">Administrator (Upload &amp; Download)</option>
            </select>
          </div>

          <button
            type="submit"
            id="btn-register-submit"
            className="btn-primary-gradient"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-custom me-2"></span> Creating account…
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center mt-4" style={{ fontSize: "0.875rem", color: "#9c7d62" }}>
          Already have an account?{" "}
          <Link to="/login" id="link-to-login" style={{ color: "#c8860a", fontWeight: 700 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
