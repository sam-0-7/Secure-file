import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { browseFiles, requestFileAccess, getMyRequests, downloadFile, getMockEmails } from "../api/api";

export default function UserDownloadPage() {
  const [activeTab, setActiveTab]     = useState("search");
  const [searchTerm, setSearchTerm]   = useState("");
  const [allFiles, setAllFiles]       = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [myRequests, setMyRequests]   = useState([]);
  const [loadingReq, setLoadingReq]   = useState(false);
  const [msg, setMsg]                 = useState("");

  // Download modal
  const [dlModal, setDlModal]         = useState(null); // { fileId, fileName }
  const [dlCode, setDlCode]           = useState("");
  const [dlError, setDlError]         = useState("");
  const [downloading, setDownloading] = useState(false);

  // Inbox
  const [emails, setEmails]           = useState([]);
  const [showInbox, setShowInbox]     = useState(false);

  useEffect(() => { fetchAllFiles(); fetchMyRequests(); fetchInbox(); }, []);

  async function fetchAllFiles(search = "") {
    setLoadingFiles(true); setMsg("");
    try { setAllFiles(await browseFiles(search)); }
    catch (err) { setMsg("❌ " + err.message); }
    finally { setLoadingFiles(false); }
  }

  async function fetchMyRequests() {
    setLoadingReq(true);
    try { setMyRequests(await getMyRequests()); }
    catch (_) {}
    finally { setLoadingReq(false); }
  }

  async function fetchInbox() {
    try { setEmails(await getMockEmails()); } catch (_) {}
  }

  async function handleSearch(e) {
    e.preventDefault();
    await fetchAllFiles(searchTerm);
  }

  async function handleRequestAccess(fileId) {
    setMsg("");
    try {
      const res = await requestFileAccess(fileId);
      setMsg("✅ " + res.message);
      await fetchMyRequests();
      setActiveTab("requests");
    } catch (err) { setMsg("❌ " + err.message); }
  }

  async function handleDownload(e) {
    e.preventDefault();
    if (!dlCode.trim()) { setDlError("Please enter the verification code."); return; }
    setDlError(""); setDownloading(true);
    try {
      const blob = await downloadFile(dlModal.fileId, dlCode.trim());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = dlModal.fileName;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      setDlModal(null); setDlCode("");
      setMsg("✅ File downloaded successfully!");
    } catch (err) { setDlError(err.message || "Invalid or expired code."); }
    finally { setDownloading(false); }
  }

  const approvedRequests = myRequests.filter(r => r.status === "Approved");

  return (
    <div className="cp-page">
      <div className="cp-breadcrumb">
        <Link to="/">HOME</Link><span> / </span><span>User</span>
      </div>

      <div className="cp-tab-bar">
        {[
          { key: "search",   label: "🔍 Search Files" },
          { key: "requests", label: `📋 My Requests${myRequests.filter(r=>r.status==="waiting").length > 0 ? ` (${myRequests.filter(r=>r.status==="waiting").length})` : ""}` },
          { key: "download", label: `⬇️ Downloads${approvedRequests.length > 0 ? ` (${approvedRequests.length})` : ""}` },
        ].map(t => (
          <button key={t.key} className={`cp-tab${activeTab === t.key ? " active" : ""}`}
            onClick={() => setActiveTab(t.key)} id={`tab-${t.key}`}>{t.label}</button>
        ))}
        <button className="cp-tab" onClick={() => { setShowInbox(!showInbox); fetchInbox(); }}
          id="tab-inbox" style={{ marginLeft: "auto" }}>
          📨 {showInbox ? "Hide" : "Inbox"}
        </button>
      </div>

      {msg && (
        <div className={`cp-alert-${msg.startsWith("✅") ? "success" : "error"}`}
          style={{ margin: "1rem 0" }}>{msg}</div>
      )}

      {/* ── Search Files ── */}
      {activeTab === "search" && (
        <div className="cp-section">
          <h1 className="cp-section-title">Search Files</h1>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <input type="text" className="cp-input" style={{ flex: 1, maxWidth: 400 }}
              placeholder="Search by file name or owner…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              id="search-input" />
            <button type="submit" className="cp-btn-primary" style={{ maxWidth: 120 }} id="btn-search">
              Search
            </button>
            <button type="button" className="cp-btn-secondary" style={{ maxWidth: 120 }}
              onClick={() => { setSearchTerm(""); fetchAllFiles(""); }}>
              Clear
            </button>
          </form>
          <div className="cp-table-wrap">
            {loadingFiles ? (
              <div className="cp-table-empty">Searching…</div>
            ) : allFiles.length === 0 ? (
              <div className="cp-table-empty">No files found. Try a different search term.</div>
            ) : (
              <table className="cp-table" id="browse-files-table">
                <thead>
                  <tr><th>#</th><th>File Name</th><th>Owner</th><th>Type</th><th>Encrypted</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {allFiles.map((f, i) => (
                    <tr key={f.id}>
                      <td>{i + 1}</td>
                      <td className="cp-td-filename">{f.originalName}</td>
                      <td>{f.uploadedBy}</td>
                      <td>{f.mimeType?.split("/")[1] || "file"}</td>
                      <td><span className="cp-badge-ok">🔒 Yes</span></td>
                      <td>
                        <button className="cp-decrypt-btn" id={`btn-request-${f.id}`}
                          onClick={() => handleRequestAccess(f.id)}>
                          🔑 Request Access
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

      {/* ── My Requests ── */}
      {activeTab === "requests" && (
        <div className="cp-section">
          <h1 className="cp-section-title">My Access Requests</h1>
          <div className="cp-table-wrap">
            {loadingReq ? (
              <div className="cp-table-empty">Loading…</div>
            ) : myRequests.length === 0 ? (
              <div className="cp-table-empty">No requests yet. Go to Search Files to request access.</div>
            ) : (
              <table className="cp-table" id="my-requests-table">
                <thead>
                  <tr><th>#</th><th>File Name</th><th>Owner</th><th>Status</th><th>Requested</th></tr>
                </thead>
                <tbody>
                  {myRequests.map((r, i) => (
                    <tr key={r.id}>
                      <td>{i + 1}</td>
                      <td className="cp-td-filename">{r.fileName}</td>
                      <td>{r.ownerUsername}</td>
                      <td>
                        <span className={`cp-badge-${r.status === "Approved" ? "ok" : r.status === "Rejected" ? "err" : "warn"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>{new Date(r.requestedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <button className="cp-btn-secondary" onClick={fetchMyRequests}
            style={{ marginTop: "1rem", maxWidth: 180 }}>↻ Refresh</button>
        </div>
      )}

      {/* ── Downloads (Approved) ── */}
      {activeTab === "download" && (
        <div className="cp-section">
          <h1 className="cp-section-title">Approved Downloads</h1>
          <p style={{ color: "#8a9bb0", marginBottom: "1rem", fontSize: "0.9rem" }}>
            Files approved by the owner. Check your inbox for the verification code, then click Download.
          </p>
          <div className="cp-table-wrap">
            {approvedRequests.length === 0 ? (
              <div className="cp-table-empty">No approved downloads yet.</div>
            ) : (
              <table className="cp-table" id="approved-downloads-table">
                <thead>
                  <tr><th>#</th><th>File Name</th><th>Owner</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {approvedRequests.map((r, i) => (
                    <tr key={r.id}>
                      <td>{i + 1}</td>
                      <td className="cp-td-filename">{r.fileName}</td>
                      <td>{r.ownerUsername}</td>
                      <td><span className="cp-badge-ok">Approved</span></td>
                      <td>
                        <button className="cp-decrypt-btn" id={`btn-download-${r.id}`}
                          onClick={() => { setDlModal({ fileId: r.fileRecordId, fileName: r.fileName }); setDlCode(""); setDlError(""); }}>
                          ⬇️ Download
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

      {/* ── Inbox ── */}
      {showInbox && (
        <div className="cp-inbox" id="user-inbox-panel">
          <h3 className="cp-inbox-title">📨 Simulated Email Inbox</h3>
          <button className="cp-btn-secondary" style={{ maxWidth: 160, marginBottom: "1rem" }}
            onClick={fetchInbox}>↻ Refresh</button>
          {emails.length === 0 ? (
            <p className="cp-inbox-empty">No emails yet. Verification codes appear here when owner approves.</p>
          ) : (
            <div className="cp-email-list">
              {emails.map(email => (
                <div key={email.id} className="cp-email-item">
                  <div className="cp-email-header">
                    <span className="cp-email-to">To: {email.toEmail}</span>
                    <span className="cp-email-time">{new Date(email.sentAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="cp-email-subject">Subject: {email.subject}</div>
                  <pre className="cp-email-body">{email.body}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Download Modal ── */}
      {dlModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1050
        }}>
          <div className="cp-card" style={{ maxWidth: 440, width: "90%" }}>
            <h3 style={{ marginBottom: "0.5rem" }}>⬇️ Download: {dlModal.fileName}</h3>
            <p style={{ color: "#8a9bb0", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
              Enter the verification code from your email inbox.
            </p>
            {dlError && <div className="cp-alert-error" style={{ marginBottom: "1rem" }}>{dlError}</div>}
            <form onSubmit={handleDownload}>
              <div className="cp-field">
                <label className="cp-label">Verification Code (SF-XXXXXX)</label>
                <input type="text" className="cp-input" id="dl-code-input"
                  placeholder="SF-123456" value={dlCode}
                  onChange={e => setDlCode(e.target.value)} autoFocus />
              </div>
              <button type="submit" className="cp-btn-primary" disabled={downloading} id="btn-confirm-download">
                {downloading ? "Downloading…" : "Authorize & Download"}
              </button>
              <button type="button" className="cp-btn-secondary"
                onClick={() => { setDlModal(null); setDlCode(""); setDlError(""); }}
                id="btn-cancel-download">
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
