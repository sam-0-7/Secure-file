import { useState, useEffect } from "react";
import { getMyFiles, requestSecureCredential, requestVulnerableCredential, uploadFile, downloadFile, requestDownloadKey, getMockEmails, getSecurityStatus } from "../api/api";
import { useAuth } from "../context/AuthContext";

function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString();
}

function getMimeBadge(mime) {
  if (!mime) return <span className="mime-badge other">unknown</span>;
  if (mime.includes("pdf")) return <span className="mime-badge pdf">PDF</span>;
  if (mime.includes("image")) return <span className="mime-badge img">Image</span>;
  return <span className="mime-badge other">{mime.split("/")[1] || "file"}</span>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [filesError, setFilesError] = useState("");

  // Credential request form
  const [credForm, setCredForm] = useState({ originalName: "", mimeType: "image/jpeg", sizeBytes: "" });
  const [credential, setCredential] = useState(null);
  const [vulnCredential, setVulnCredential] = useState(null);
  const [credLoading, setCredLoading] = useState(false);
  const [credError, setCredError] = useState("");

  // Real Upload states
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  // Download verification state
  const [verifyingFile, setVerifyingFile] = useState(null);
  const [verifyingCode, setVerifyingCode] = useState("");
  const [requestKeyLoading, setRequestKeyLoading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState("");

  // Simulated email inbox state
  const [emails, setEmails] = useState([]);
  const [showInbox, setShowInbox] = useState(false);
  const [securityMode, setSecurityMode] = useState("Demo");

  useEffect(() => {
    fetchFiles();
    fetchInbox();
    checkSecurityMode();
  }, []);

  async function checkSecurityMode() {
    try {
      const data = await getSecurityStatus();
      if (data?.securityMode === "Full" || data?.SecurityMode === "Full") {
        setSecurityMode("Full");
      }
    } catch (err) {
      console.error("Failed to fetch security status:", err);
    }
  }

  async function fetchFiles() {
    setLoadingFiles(true);
    setFilesError("");
    try {
      const data = await getMyFiles();
      setFiles(data);
    } catch (err) {
      setFilesError(err.message || "Failed to load files.");
    } finally {
      setLoadingFiles(false);
    }
  }

  async function handleSecureCredential(e) {
    e.preventDefault();
    setCredError("");
    setCredential(null);
    if (!credForm.originalName || !credForm.sizeBytes) {
      setCredError("Please fill in file name and size.");
      return;
    }
    setCredLoading(true);
    try {
      const data = await requestSecureCredential({
        originalName: credForm.originalName,
        mimeType: credForm.mimeType,
        sizeBytes: Number(credForm.sizeBytes),
      });
      setCredential(data);
    } catch (err) {
      setCredError(err.message || "Failed to request credential.");
    } finally {
      setCredLoading(false);
    }
  }

  async function handleVulnerableCredential() {
    if (securityMode === "Full") {
      setCredError("Vulnerable credential generation is disabled in Full Security Mode.");
      return;
    }
    setVulnCredential(null);
    try {
      const data = await requestVulnerableCredential();
      setVulnCredential(data);
    } catch (err) {
      setCredError(err.message);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess("");
    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploadingFile(true);
    try {
      await uploadFile(formData);
      setUploadSuccess("File uploaded and encrypted successfully!");
      setSelectedFile(null);
      const fileInput = document.getElementById("file-upload-input");
      if (fileInput) fileInput.value = "";
      await fetchFiles();
    } catch (err) {
      setUploadError(err.message || "Failed to upload file.");
    } finally {
      setUploadingFile(false);
    }
  }

  function triggerDownload(file) {
    setVerifyingFile(file);
    setVerifyingCode("");
    setDownloadError("");
    setDownloadSuccess("");
  }

  async function handleSendKey() {
    if (!verifyingFile) return;
    setDownloadError("");
    setDownloadSuccess("");
    setRequestKeyLoading(true);
    try {
      const fileId = verifyingFile.Id || verifyingFile.id;
      const data = await requestDownloadKey(fileId);
      setDownloadSuccess(data.message || "Key sent to your registered email address!");
      await fetchInbox();
    } catch (err) {
      setDownloadError(err.message || "Failed to request verification key.");
    } finally {
      setRequestKeyLoading(false);
    }
  }

  async function handleVerifyAndDownload(e) {
    e.preventDefault();
    if (!verifyingFile) return;
    if (!verifyingCode.trim()) {
      setDownloadError("Please enter the verification key.");
      return;
    }

    setDownloadError("");
    setDownloadSuccess("");
    try {
      const fileId = verifyingFile.Id || verifyingFile.id;
      const originalName = verifyingFile.originalName || verifyingFile.OriginalName;
      const blob = await downloadFile(fileId, verifyingCode.trim());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      setVerifyingFile(null);
      setVerifyingCode("");
    } catch (err) {
      setDownloadError(err.message || "Invalid or expired verification key.");
    }
  }

  async function fetchInbox() {
    try {
      const inboxData = await getMockEmails();
      setEmails(inboxData);
    } catch (err) {
      console.error("Failed to load simulated inbox", err);
    }
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Header */}
        <div className="mb-4">
          <h1 className="page-title">📁 Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, <strong style={{ color: "#c8860a" }}>{user?.username}</strong>. Manage your encrypted files below.
          </p>
        </div>

        {securityMode === "Full" && (
          <div className="security-mode-banner" id="dashboard-security-banner">
            <div className="security-mode-banner-text">
              <h3>🛡️ Full Security Mode Active</h3>
              <p>The system is operating under strict OWASP-mitigated guidelines. Insecure pathways (V1–V4 direct credential retrieval) are locked.</p>
            </div>
            <div style={{ fontSize: "1.8rem", userSelect: "none" }}>🔒</div>
          </div>
        )}

        {/* Stats Row */}
        <div className="row g-3 mb-4">
          <div className="col-sm-4">
            <div className="stat-card">
              <div className="stat-icon purple">📂</div>
              <div>
                <div className="stat-value">{loadingFiles ? "…" : files.length}</div>
                <div className="stat-label">Total Files</div>
              </div>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="stat-card">
              <div className="stat-icon green">🔒</div>
              <div>
                <div className="stat-value">{loadingFiles ? "…" : files.filter(f => f.isEncrypted).length}</div>
                <div className="stat-label">Encrypted</div>
              </div>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="stat-card">
              <div className="stat-icon blue">💾</div>
              <div>
                <div className="stat-value">
                  {loadingFiles ? "…" : formatBytes(files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0))}
                </div>
                <div className="stat-label">Total Size</div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload File Section - Admin Only */}
        {user?.role === "Admin" ? (
          <div className="upload-section mb-4">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
              📤 Upload File (Admin Only)
            </h2>
            {uploadError && (
              <div className="alert-dark-danger mb-3">{uploadError}</div>
            )}
            {uploadSuccess && (
              <div className="alert-dark-success mb-3">{uploadSuccess}</div>
            )}
            <form onSubmit={handleUpload} id="file-upload-form">
              <div className="row align-items-end g-3">
                <div className="col-md-9">
                  <label className="form-label-light">Select File (JPEG, PNG, PDF - Max 10MB)</label>
                  <input
                    id="file-upload-input"
                    type="file"
                    className="form-control form-control-dark"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    onChange={(e) => {
                      setSelectedFile(e.target.files[0] || null);
                      setUploadError("");
                      setUploadSuccess("");
                    }}
                  />
                </div>
                <div className="col-md-3">
                  <button
                    id="btn-upload-submit"
                    type="submit"
                    className="btn-primary-gradient w-100"
                    style={{ padding: "0.6rem 1.5rem" }}
                    disabled={uploadingFile || !selectedFile}
                  >
                    {uploadingFile ? (
                      <><span className="spinner-custom"></span> Uploading…</>
                    ) : (
                      "Encrypt & Upload"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="upload-section mb-4" style={{ borderLeft: "4px solid #b8a090" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              📤 File Uploads Restricted
            </h2>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#665040" }}>
              Only administrator accounts are permitted to upload files. Your current account role is <strong>{user?.role}</strong>.
            </p>
          </div>
        )}

        {/* Upload Credential Section */}
        <div className="upload-section mb-4">
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
            🔑 Request Upload Credential
          </h2>

          {credError && (
            <div className="alert-dark-danger mb-3" id="cred-error">{credError}</div>
          )}

          <form onSubmit={handleSecureCredential} id="secure-cred-form">
            <div className="row g-3">
              <div className="col-md-5">
                <label className="form-label-light">File Name</label>
                <input
                  id="cred-filename"
                  type="text"
                  className="form-control form-control-dark"
                  placeholder="e.g. report.pdf"
                  value={credForm.originalName}
                  onChange={(e) => setCredForm(p => ({ ...p, originalName: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label-light">File Type</label>
                <select
                  id="cred-mimetype"
                  className="form-control form-control-dark"
                  value={credForm.mimeType}
                  onChange={(e) => setCredForm(p => ({ ...p, mimeType: e.target.value }))}
                  style={{ cursor: "pointer" }}
                >
                  <option value="image/jpeg">JPEG Image</option>
                  <option value="image/png">PNG Image</option>
                  <option value="application/pdf">PDF Document</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label-light">Size (bytes)</label>
                <input
                  id="cred-size"
                  type="number"
                  className="form-control form-control-dark"
                  placeholder="e.g. 204800"
                  value={credForm.sizeBytes}
                  onChange={(e) => setCredForm(p => ({ ...p, sizeBytes: e.target.value }))}
                  min="1"
                />
              </div>
            </div>
            <div className="d-flex gap-3 mt-3">
              <button
                id="btn-secure-credential"
                type="submit"
                className="btn-primary-gradient"
                style={{ width: "auto", padding: "0.6rem 1.5rem" }}
                disabled={credLoading}
              >
                {credLoading ? <><span className="spinner-custom"></span> Requesting…</> : "🔒 Secure Credential"}
              </button>
              <button
                id="btn-vuln-credential"
                type="button"
                className={`btn-outline-light-custom ${securityMode === "Full" ? "disabled-secure-btn" : ""}`}
                onClick={handleVulnerableCredential}
                disabled={securityMode === "Full"}
                style={securityMode === "Full" ? { cursor: "not-allowed", opacity: 0.5, borderStyle: "dashed" } : {}}
              >
                {securityMode === "Full" ? "🔒 Vulnerable Credential (Disabled)" : "⚠️ Vulnerable Credential (Demo)"}
              </button>
            </div>
          </form>

          {/* Secure Credential Result */}
          {credential && (
            <div className="mt-3">
              <p style={{ color: "#3d5a30", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                ✅ Secure Credential Issued:
              </p>
              <div className="credential-box" id="secure-credential-result">
                <div>🔗 Upload URL: {credential.uploadUrl}</div>
                <div>📄 Stored Name: {credential.storedName}</div>
                <div>⏰ Expires: {new Date(credential.expires * 1000).toLocaleString()}</div>
                <div>🔏 Signature: {credential.signature}</div>
              </div>
            </div>
          )}

          {/* Vulnerable Credential Result */}
          {vulnCredential && (
            <div className="mt-3">
              <p style={{ color: "#92400e", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                ⚠️ Vulnerable Credential (Insecure — for demo only):
              </p>
              <div className="credential-box" id="vuln-credential-result" style={{ borderColor: "rgba(180,83,9,0.35)", color: "#92400e", background: "rgba(180,83,9,0.06)" }}>
                <div>🔗 Upload URL: {vulnCredential.uploadUrl}</div>
                <div>🔑 Token: {vulnCredential.token}</div>
                <div>⏰ Expires: {new Date(vulnCredential.expires).toLocaleString()}</div>
                <div>📂 Allowed Types: {vulnCredential.allowedTypes}</div>
                <div>📦 Max Size: {vulnCredential.maxSize}</div>
              </div>
            </div>
          )}
        </div>

        {/* Files & Inbox Split Layout */}
        <div className="row g-4 mb-5">
          <div className={showInbox ? "col-lg-8" : "col-lg-12"} style={{ transition: "all 0.3s ease" }}>
            {/* Files Table */}
            <div className="glass-card p-0 overflow-hidden" id="files-table-section">
              <div className="d-flex align-items-center justify-content-between px-4 py-3"
                style={{ borderBottom: "1px solid rgba(180,130,70,0.18)", background: "#fdf3e3" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Files</h2>
                <div className="d-flex gap-2">
                  <button
                    id="btn-toggle-inbox"
                    className="btn-outline-light-custom"
                    onClick={() => setShowInbox(!showInbox)}
                    style={{ color: "#c8860a", borderColor: "rgba(200,134,10,0.3)" }}
                  >
                    {showInbox ? "📨 Hide Simulated Inbox" : "📨 Open Simulated Inbox"}
                  </button>
                  <button
                    id="btn-refresh-files"
                    className="btn-outline-light-custom"
                    onClick={fetchFiles}
                    disabled={loadingFiles}
                  >
                    {loadingFiles ? "Refreshing…" : "🔄 Refresh"}
                  </button>
                </div>
              </div>

              {filesError && (
                <div className="alert-dark-danger m-3" id="files-error">{filesError}</div>
              )}

              {loadingFiles ? (
                <div className="empty-state">
                  <div><span className="spinner-custom"></span></div>
                  <p className="mt-3">Loading files…</p>
                </div>
              ) : files.length === 0 ? (
                <div className="empty-state" id="files-empty">
                  <div className="empty-icon">📭</div>
                  <p style={{ fontWeight: 600 }}>No files yet</p>
                  <p style={{ fontSize: "0.85rem" }}>Upload a file above or request a credential to see files.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table-dark-custom" id="files-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>File Name</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Encrypted</th>
                        <th>Uploaded By</th>
                        <th>Uploaded At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((f, i) => (
                        <tr key={f.id}>
                          <td style={{ color: "#b8a090" }}>{i + 1}</td>
                          <td><strong>{f.originalName}</strong></td>
                          <td>{getMimeBadge(f.mimeType)}</td>
                          <td>{formatBytes(f.sizeBytes)}</td>
                          <td>{f.isEncrypted ? "🔒 Yes" : "🔓 No"}</td>
                          <td>{f.uploadedBy}</td>
                          <td style={{ color: "#9c7d62" }}>{formatDate(f.uploadedAt)}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              style={{
                                borderColor: "#c8860a",
                                color: "#c8860a",
                                fontWeight: 600,
                                padding: "0.25rem 0.75rem",
                                borderRadius: "4px",
                                background: "transparent",
                                fontSize: "0.8rem",
                                transition: "all 0.2s"
                              }}
                              onClick={() => triggerDownload(f)}
                              onMouseEnter={(e) => {
                                e.target.style.background = "#c8860a";
                                e.target.style.color = "#fff";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = "transparent";
                                e.target.style.color = "#c8860a";
                              }}
                            >
                              ⬇️ Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {showInbox && (
            <div className="col-lg-4">
              {/* Simulated Inbox Card */}
              <div className="glass-card p-0 overflow-hidden" style={{ border: "1px solid rgba(180,130,70,0.25)" }}>
                <div className="d-flex align-items-center justify-content-between px-4 py-3"
                  style={{ borderBottom: "1px solid rgba(180,130,70,0.18)", background: "#fdf3e3" }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>📨 Simulated Inbox</h2>
                  <button
                    className="btn btn-sm btn-link text-decoration-none"
                    style={{ color: "#c8860a", fontWeight: 600 }}
                    onClick={fetchInbox}
                  >
                    🔄 Check Mail
                  </button>
                </div>
                <div style={{ maxHeight: "500px", overflowY: "auto", background: "rgba(255,255,255,0.4)" }} className="p-3">
                  {emails.length === 0 ? (
                    <div className="text-center py-5" style={{ color: "#9c7d62" }}>
                      <div style={{ fontSize: "2rem" }}>📭</div>
                      <p style={{ margin: 0, fontWeight: 600 }}>Your inbox is empty</p>
                      <p style={{ fontSize: "0.8rem", margin: 0 }}>Verification emails will appear here.</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {emails.map((email) => (
                        <div key={email.id} className="p-3 rounded" style={{
                          background: "#fff",
                          border: "1px solid rgba(180,130,70,0.15)",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                        }}>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#c8860a" }}>
                              To: {email.toEmail}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "#9c7d62" }}>
                              {new Date(email.sentAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <h6 style={{ fontSize: "0.85rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "#3d2a1d" }}>
                            Subject: {email.subject}
                          </h6>
                          <pre style={{
                            margin: 0,
                            fontSize: "0.75rem",
                            whiteSpace: "pre-wrap",
                            fontFamily: "var(--font-mono, monospace)",
                            background: "#faf6f0",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid rgba(180,130,70,0.08)",
                            color: "#543d2b"
                          }}>
                            {email.body}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      {/* Verification Code Overlay Modal */}
      {verifyingFile && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(61, 42, 29, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1050
        }}>
          <div className="glass-card" style={{ maxWidth: "480px", width: "90%", padding: "2rem", border: "1px solid rgba(180,130,70,0.3)", background: "#faf6f0" }}>
            <h3 style={{ fontWeight: 700, color: "#3d2a1d", marginBottom: "0.5rem" }}>
              🔒 Verification Required
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#665040", marginBottom: "1.5rem" }}>
              To download <strong>{verifyingFile.originalName || verifyingFile.OriginalName}</strong>, we must verify your identity. A temporary security code will be sent to your registered email address.
            </p>

            {downloadError && (
              <div className="alert-dark-danger mb-3">{downloadError}</div>
            )}
            {downloadSuccess && (
              <div className="alert-dark-success mb-3">{downloadSuccess}</div>
            )}

            <div className="d-flex flex-column gap-3 mb-2">
              <button
                type="button"
                className="btn-primary-gradient w-100"
                style={{ padding: "0.6rem" }}
                onClick={handleSendKey}
                disabled={requestKeyLoading}
              >
                {requestKeyLoading ? "Sending Key..." : "📨 Send Verification Key to Email"}
              </button>

              <form onSubmit={handleVerifyAndDownload}>
                <div className="mb-3">
                  <label className="form-label-light">Verification Key (SF-XXXXXX)</label>
                  <input
                    type="text"
                    className="form-control form-control-dark text-center"
                    style={{ fontSize: "1.2rem", letterSpacing: "2px", fontWeight: 700, background: "#fff", color: "#3d2a1d" }}
                    placeholder="SF-123456"
                    value={verifyingCode}
                    onChange={(e) => setVerifyingCode(e.target.value)}
                    required
                  />
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn-primary-gradient w-100"
                    style={{ padding: "0.6rem" }}
                  >
                    Authorize & Download
                  </button>
                  <button
                    type="button"
                    className="btn-outline-light-custom w-100"
                    onClick={() => {
                      setVerifyingFile(null);
                      setVerifyingCode("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
