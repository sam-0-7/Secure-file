import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyFiles, uploadFile, getOwnerAccessRequests, approveAccessRequest, rejectAccessRequest, getMockEmails } from "../api/api";
import { useAuth } from "../context/AuthContext";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString();
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("fileinfo");

  // File state
  const [files, setFiles]               = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [fileError, setFileError]       = useState("");

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [uploadError, setUploadError]   = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  // Access requests state
  const [requests, setRequests]         = useState([]);
  const [loadingReq, setLoadingReq]     = useState(false);
  const [reqMsg, setReqMsg]             = useState("");

  // Inbox
  const [emails, setEmails]     = useState([]);
  const [showInbox, setShowInbox] = useState(false);

  useEffect(() => { fetchFiles(); fetchRequests(); fetchInbox(); }, []);

  async function fetchFiles() {
    setLoadingFiles(true); setFileError("");
    try { setFiles(await getMyFiles()); }
    catch (err) { setFileError(err.message || "Failed to load files."); }
    finally { setLoadingFiles(false); }
  }

  async function fetchRequests() {
    setLoadingReq(true);
    try { setRequests(await getOwnerAccessRequests()); }
    catch (_) {}
    finally { setLoadingReq(false); }
  }

  async function fetchInbox() {
    try { setEmails(await getMockEmails()); } catch (_) {}
  }

  async function handleUpload(e) {
    e.preventDefault();
    setUploadError(""); setUploadSuccess("");
    if (!selectedFile) { setUploadError("Please select a file."); return; }
    const fd = new FormData();
    fd.append("file", selectedFile);
    setUploading(true);
    try {
      await uploadFile(fd);
      setUploadSuccess("File uploaded and encrypted successfully!");
      setSelectedFile(null);
      const inp = document.getElementById("owner-file-input");
      if (inp) inp.value = "";
      await fetchFiles();
      setActiveTab("fileinfo");
    } catch (err) {
      setUploadError(err.message || "Upload failed.");
    } finally { setUploading(false); }
  }

  async function handleApprove(reqId) {
    setReqMsg("");
    try {
      const res = await approveAccessRequest(reqId);
      setReqMsg("✅ " + res.message);
      await fetchRequests();
    } catch (err) { setReqMsg("❌ " + err.message); }
  }

  async function handleReject(reqId) {
    setReqMsg("");
    try {
      const res = await rejectAccessRequest(reqId);
      setReqMsg("✅ " + res.message);
      await fetchRequests();
    } catch (err) { setReqMsg("❌ " + err.message); }
  }

  const pendingCount = requests.filter(r => r.status === "waiting").length;

  return (
    <div className="cp-page">
      <div className="cp-breadcrumb">
        <Link to="/">HOME</Link><span> / </span><span>Owner</span>
      </div>

      <div className="cp-tab-bar">
        {[
          { key: "fileupload", label: "FILE UPLOAD" },
          { key: "fileinfo",   label: "FILE INFO" },
          { key: "fileapproved", label: `REQUESTS${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
        ].map(t => (
          <button
            key={t.key}
            className={`cp-tab${activeTab === t.key ? " active" : ""}`}
            onClick={() => setActiveTab(t.key)}
            id={`tab-${t.key}`}
          >
            {t.label}
          </button>
        ))}
        <button
          className="cp-tab"
          onClick={() => { setShowInbox(!showInbox); fetchInbox(); }}
          id="tab-inbox"
          style={{ marginLeft: "auto" }}
        >
          📨 {showInbox ? "Hide" : "Inbox"}
        </button>
      </div>

      {/* ── File Upload ── */}
      {activeTab === "fileupload" && (
        <div className="cp-section">
          <h1 className="cp-section-title">Upload File</h1>
          <div className="cp-card" style={{ maxWidth: 680 }}>
            {uploadError   && <div className="cp-alert-error">{uploadError}</div>}
            {uploadSuccess && <div className="cp-alert-success">{uploadSuccess}</div>}
            <form onSubmit={handleUpload} id="owner-upload-form">
              <div className="cp-field">
                <label htmlFor="owner-file-input" className="cp-label">
                  Select File (JPEG, PNG, PDF — Max 10 MB)
                </label>
                <input type="file" id="owner-file-input" className="cp-input"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => { setSelectedFile(e.target.files[0] || null); setUploadError(""); setUploadSuccess(""); }} />
              </div>
              <button type="submit" className="cp-btn-primary" disabled={uploading || !selectedFile} id="btn-owner-upload">
                {uploading ? "Uploading…" : "UPLOAD & ENCRYPT"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── File Info ── */}
      {activeTab === "fileinfo" && (
        <div className="cp-section">
          <h1 className="cp-section-title">Uploaded File Information</h1>
          {fileError && <div className="cp-alert-error">{fileError}</div>}
          <div className="cp-table-wrap">
            {loadingFiles ? (
              <div className="cp-table-empty">Loading files…</div>
            ) : files.length === 0 ? (
              <div className="cp-table-empty">No files yet — go to FILE UPLOAD to add files.</div>
            ) : (
              <table className="cp-table" id="owner-files-table">
                <thead>
                  <tr><th>Owner</th><th>File Info</th><th>File Name</th><th>Encrypted</th><th>Uploaded</th></tr>
                </thead>
                <tbody>
                  {files.map((f, i) => (
                    <tr key={f.id || i}>
                      <td>{f.uploadedBy || user?.username || "—"}</td>
                      <td>{f.mimeType?.split("/")[1] || "file"}</td>
                      <td className="cp-td-filename">{f.originalName}</td>
                      <td><span className="cp-badge-ok">🔒 AES-256</span></td>
                      <td>{formatDate(f.uploadedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <button className="cp-btn-secondary" onClick={fetchFiles} id="btn-refresh-owner"
            style={{ marginTop: "1rem", maxWidth: 180 }}>↻ Refresh</button>
        </div>
      )}

      {/* ── Access Requests ── */}
      {activeTab === "fileapproved" && (
        <div className="cp-section">
          <h1 className="cp-section-title">User File Access Requests</h1>
          <p style={{ color: "#8a9bb0", marginBottom: "1rem", fontSize: "0.9rem" }}>
            Users who request your files appear here. Approve to send them a download key.
          </p>
          {reqMsg && (
            <div className={`cp-alert-${reqMsg.startsWith("✅") ? "success" : "error"}`}
              style={{ marginBottom: "1rem" }}>{reqMsg}</div>
          )}
          <div className="cp-table-wrap">
            {loadingReq ? (
              <div className="cp-table-empty">Loading requests…</div>
            ) : requests.length === 0 ? (
              <div className="cp-table-empty">No access requests yet.</div>
            ) : (
              <table className="cp-table" id="access-requests-table">
                <thead>
                  <tr><th>#</th><th>File Name</th><th>Requested By</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {requests.map((r, i) => (
                    <tr key={r.id}>
                      <td>{i + 1}</td>
                      <td className="cp-td-filename">{r.fileName}</td>
                      <td>{r.requestingUsername}</td>
                      <td>
                        <span className={`cp-badge-${r.status === "Approved" ? "ok" : r.status === "Rejected" ? "err" : "warn"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>{formatDate(r.requestedAt)}</td>
                      <td style={{ display: "flex", gap: "0.4rem" }}>
                        {r.status === "waiting" && (
                          <>
                            <button className="cp-btn-primary" id={`btn-approve-req-${r.id}`}
                              style={{ padding: "0.35rem 0.8rem", fontSize: "0.8rem" }}
                              onClick={() => handleApprove(r.id)}>✅ Approve</button>
                            <button className="cp-btn-danger" id={`btn-reject-req-${r.id}`}
                              style={{ padding: "0.35rem 0.8rem", fontSize: "0.8rem" }}
                              onClick={() => handleReject(r.id)}>❌ Reject</button>
                          </>
                        )}
                        {r.status !== "waiting" && <span style={{ color: "#8a9bb0", fontSize: "0.85rem" }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <button className="cp-btn-secondary" onClick={fetchRequests} id="btn-refresh-requests"
            style={{ marginTop: "1rem", maxWidth: 180 }}>↻ Refresh</button>
        </div>
      )}

      {/* ── Inbox ── */}
      {showInbox && (
        <div className="cp-inbox" id="owner-inbox-panel">
          <h3 className="cp-inbox-title">📨 Simulated Email Inbox</h3>
          {emails.length === 0 ? (
            <p className="cp-inbox-empty">No emails yet.</p>
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
    </div>
  );
}
