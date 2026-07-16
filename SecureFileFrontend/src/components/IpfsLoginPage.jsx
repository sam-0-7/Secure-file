import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function IpfsLoginPage() {
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
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "IPFS login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cp-page">
      <div className="cp-breadcrumb">
        <Link to="/">HOME</Link>
        <span> / </span>
        <span>IPFS</span>
      </div>
      <div className="cp-section">
        <h1 className="cp-section-title">IPFS Node Login Here..!</h1>
        <div className="cp-card">
          {error && <div className="cp-alert-error" id="ipfs-login-error">⚠ {error}</div>}
          <form onSubmit={handleSubmit} id="ipfs-login-form" noValidate>
            <div className="cp-field">
              <label htmlFor="ipfs-username" className="cp-label">IPFS Node ID / Username</label>
              <input type="text" id="ipfs-username" name="username" className="cp-input"
                value={form.username} onChange={handleChange} autoFocus />
            </div>
            <div className="cp-field">
              <label htmlFor="ipfs-password" className="cp-label">Password</label>
              <input type="password" id="ipfs-password" name="password" className="cp-input"
                value={form.password} onChange={handleChange} />
            </div>
            <button type="submit" className="cp-btn-primary" disabled={loading} id="btn-ipfs-login">
              {loading ? "Connecting…" : "SUBMIT"}
            </button>
            <button type="button" className="cp-btn-secondary"
              onClick={() => { setForm({ username: "", password: "" }); setError(""); }}
              id="btn-ipfs-reset">
              RESET
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
