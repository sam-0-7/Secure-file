import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPendingOwners, getAllOwners, getAllUsers, getAllFiles, approveOwner, rejectOwner } from "../api/api";

export default function ServerHomePage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [owners, setOwners]   = useState([]);
  const [users, setUsers]     = useState([]);
  const [files, setFiles]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState("");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [p, o, u, f] = await Promise.all([
        getPendingOwners(), getAllOwners(), getAllUsers(), getAllFiles()
      ]);
      setPending(p); setOwners(o); setUsers(u); setFiles(f);
    } catch (err) {
      setMsg("Error loading data: " + err.message);
    } finally { setLoading(false); }
  }

  async function handleApprove(id) {
    setMsg("");
    try {
      const res = await approveOwner(id);
      setMsg("✅ " + res.message);
      await fetchAll();
    } catch (err) { setMsg("❌ " + err.message); }
  }

  async function handleReject(id) {
    setMsg("");
    try {
      const res = await rejectOwner(id);
      setMsg("✅ " + res.message);
      await fetchAll();
    } catch (err) { setMsg("❌ " + err.message); }
  }

  const tabs = [
    { key: "pending", label: "⏳ Pending Owners", count: pending.length },
    { key: "owners",  label: "👑 All Owners",     count: owners.length },
    { key: "users",   label: "👤 All Users",      count: users.length },
    { key: "files",   label: "📁 All Files",      count: files.length },
  ];

  return (
    <div className="cp-page">
      <div className="cp-breadcrumb">
        <Link to="/">HOME</Link>
        <span> / </span>
        <span>Server Admin</span>
      </div>

      <div className="cp-tab-bar">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`cp-tab${activeTab === t.key ? " active" : ""}`}
            onClick={() => setActiveTab(t.key)}
            id={`tab-${t.key}`}
          >
            {t.label}
            {t.count > 0 && <span className="cp-tab-badge">{t.count}</span>}
          </button>
        ))}
      </div>

      {msg && (
        <div className={`cp-alert-${msg.startsWith("✅") ? "success" : "error"}`}
          style={{ margin: "1rem 0" }}>
          {msg}
        </div>
      )}

      {loading && <div className="cp-table-empty">Loading…</div>}

      {/* ── Pending Owners ── */}
      {!loading && activeTab === "pending" && (
        <div className="cp-section">
          <h1 className="cp-section-title">Owner Registration Requests</h1>
          <p style={{ color: "#8a9bb0", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
            Review and approve or reject owner registrations. Approved owners receive a login key by email.
          </p>
          <div className="cp-table-wrap">
            {pending.length === 0 ? (
              <div className="cp-table-empty">No pending owner registrations.</div>
            ) : (
              <table className="cp-table" id="pending-owners-table">
                <thead>
                  <tr>
                    <th>#</th><th>Username</th><th>Email</th>
                    <th>Registered</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((o, i) => (
                    <tr key={o.id}>
                      <td>{i + 1}</td>
                      <td><strong>{o.username}</strong></td>
                      <td>{o.email}</td>
                      <td>{new Date(o.createdAt).toLocaleString()}</td>
                      <td style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="cp-btn-primary"
                          style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                          onClick={() => handleApprove(o.id)}
                          id={`btn-approve-${o.id}`}
                        >
                          ✅ Approve
                        </button>
                        <button
                          className="cp-btn-danger"
                          style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                          onClick={() => handleReject(o.id)}
                          id={`btn-reject-${o.id}`}
                        >
                          ❌ Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── All Owners ── */}
      {!loading && activeTab === "owners" && (
        <div className="cp-section">
          <h1 className="cp-section-title">All Registered Owners</h1>
          <div className="cp-table-wrap">
            {owners.length === 0 ? (
              <div className="cp-table-empty">No owners registered yet.</div>
            ) : (
              <table className="cp-table" id="all-owners-table">
                <thead>
                  <tr><th>#</th><th>Username</th><th>Email</th><th>Status</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {owners.map((o, i) => (
                    <tr key={o.id}>
                      <td>{i + 1}</td>
                      <td><strong>{o.username}</strong></td>
                      <td>{o.email}</td>
                      <td>
                        <span className={`cp-badge-${o.status === "Active" ? "ok" : o.status === "waiting" ? "warn" : "err"}`}>
                          {o.status}
                        </span>
                      </td>
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── All Users ── */}
      {!loading && activeTab === "users" && (
        <div className="cp-section">
          <h1 className="cp-section-title">All Registered Users</h1>
          <div className="cp-table-wrap">
            {users.length === 0 ? (
              <div className="cp-table-empty">No users registered yet.</div>
            ) : (
              <table className="cp-table" id="all-users-table">
                <thead>
                  <tr><th>#</th><th>Username</th><th>Email</th><th>Status</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id}>
                      <td>{i + 1}</td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td><span className="cp-badge-ok">{u.status}</span></td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── All Files ── */}
      {!loading && activeTab === "files" && (
        <div className="cp-section">
          <h1 className="cp-section-title">All Uploaded Files</h1>
          <div className="cp-table-wrap">
            {files.length === 0 ? (
              <div className="cp-table-empty">No files uploaded yet.</div>
            ) : (
              <table className="cp-table" id="all-files-table">
                <thead>
                  <tr><th>#</th><th>File Name</th><th>Type</th><th>Owner</th><th>Encrypted</th><th>Uploaded</th></tr>
                </thead>
                <tbody>
                  {files.map((f, i) => (
                    <tr key={f.id}>
                      <td>{i + 1}</td>
                      <td className="cp-td-filename">{f.originalName}</td>
                      <td>{f.mimeType?.split("/")[1] || "file"}</td>
                      <td>{f.uploadedBy}</td>
                      <td><span className="cp-badge-ok">🔒 Yes</span></td>
                      <td>{new Date(f.uploadedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
