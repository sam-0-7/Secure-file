import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const data = await loginUser(form);
      login(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="glass-card auth-card">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="auth-logo">🔐</div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your SecureFile account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert-dark-danger mb-3" role="alert" id="login-error">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate id="login-form">
          <div className="mb-3">
            <label htmlFor="login-username" className="form-label-light">
              Username
            </label>
            <input
              type="text"
              id="login-username"
              name="username"
              className="form-control form-control-dark"
              placeholder="Enter your username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label htmlFor="login-password" className="form-label-light">
              Password
            </label>
            <input
              type="password"
              id="login-password"
              name="password"
              className="form-control form-control-dark"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            id="btn-login-submit"
            className="btn-primary-gradient"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-custom me-2"></span> Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center mt-4" style={{ fontSize: "0.875rem", color: "#9c7d62" }}>
          Don't have an account?{" "}
          <Link to="/register" id="link-to-register" style={{ color: "#c8860a", fontWeight: 700 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
