import { useState, useEffect } from "react";
import { getAuditLogs } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString();
}

function ActionBadge({ action }) {
  const a = (action || "").toLowerCase();
  let cls = "other";
  if (a === "login") cls = "login";
  else if (a === "register") cls = "register";
  else if (a === "failedlogin") cls = "failedlogin";
  else if (a.includes("upload") || a.includes("credential")) cls = "upload";

  return <span className={`audit-action ${cls}`}>{action}</span>;
}

export default function AuditLogs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user?.role !== "Admin") {
      navigate("/dashboard");
      return;
    }
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    setError("");
    try {
      const data = await getAuditLogs();
      setLogs(data);
    } catch (err) {
      setError(err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = logs.filter(
    (l) =>
      !search ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.username?.toLowerCase().includes(search.toLowerCase()) ||
      l.fileName?.toLowerCase().includes(search.toLowerCase()) ||
      l.ipAddress?.includes(search)
  );

  return (
    <div className="dashboard-page" style={{ background: "#fbf9f4", color: "#5d534a" }}>
      <div className="container">
        {/* Header */}
        <div className="mb-4">
          <h1 className="page-title" style={{ color: "#3d352e" }}>🛡️ Audit Logs</h1>
          <p className="page-subtitle" style={{ color: "#8c7b6d" }}>
            Security event log — last {logs.length} entries. Admin access only.
          </p>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4">
          <div className="col-sm-4">
            <div className="stat-card">
              <div className="stat-icon purple">📋</div>
              <div>
                <div className="stat-value">{loading ? "…" : logs.length}</div>
                <div className="stat-label">Total Events</div>
              </div>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="stat-card">
              <div className="stat-icon green">✅</div>
              <div>
                <div className="stat-value">
                  {loading ? "…" : logs.filter(l => l.action?.toLowerCase() === "login").length}
                </div>
                <div className="stat-label">Successful Logins</div>
              </div>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "rgba(239,68,68,0.2)" }}>⚠️</div>
              <div>
                <div className="stat-value">
                  {loading ? "…" : logs.filter(l => l.action?.toLowerCase() === "failedlogin").length}
                </div>
                <div className="stat-label">Failed Logins</div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card p-0 overflow-hidden" id="audit-table-section">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 px-4 py-3"
            style={{ borderBottom: "1px solid rgba(180,130,70,0.18)", background: "#fdf3e3" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Event Log</h2>
            <div className="d-flex gap-2">
              <input
                id="audit-search"
                type="text"
                className="form-control form-control-dark"
                placeholder="Search events…"
                style={{ width: 220, padding: "0.45rem 0.9rem" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                id="btn-refresh-audit"
                className="btn-outline-light-custom"
                onClick={fetchLogs}
                disabled={loading}
              >
                🔄
              </button>
            </div>
          </div>

          {error && (
            <div className="alert-dark-danger m-3" id="audit-error">{error}</div>
          )}

          {loading ? (
            <div className="empty-state">
              <span className="spinner-custom"></span>
              <p className="mt-3">Loading audit logs…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state" id="audit-empty">
              <div className="empty-icon">🔍</div>
              <p>{search ? "No events match your search." : "No audit events recorded yet."}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table-dark-custom" id="audit-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Action</th>
                    <th>User</th>
                    <th>File</th>
                    <th>IP Address</th>
                    <th>Details</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log, i) => (
                    <tr key={log.id}>
                      <td style={{ color: "#b8a090" }}>{i + 1}</td>
                      <td><ActionBadge action={log.action} /></td>
                      <td>{log.username || <span style={{ color: "#c4a882" }}>Anonymous</span>}</td>
                      <td>{log.fileName || <span style={{ color: "#c4a882" }}>—</span>}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{log.ipAddress}</td>
                      <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#9c7d62" }} title={log.details}>
                        {log.details || "—"}
                      </td>
                      <td style={{ color: "#9c7d62", fontSize: "0.82rem" }}>{formatDate(log.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
