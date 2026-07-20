/**
 * api.js — All API calls to the SecureFileAPI backend.
 * In development: proxied via Vite to http://localhost:5165
 * In production:  VITE_API_BASE is set to the Railway backend URL
 */

const BASE_URL = import.meta.env.VITE_API_BASE
  ? `${import.meta.env.VITE_API_BASE}/api`
  : "/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem("sf_token");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

async function handleResponse(res) {
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text };
  }
  if (!res.ok) {
    throw new Error(data?.message || `HTTP ${res.status}`);
  }
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function registerUser({ username, email, password, role }) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password, role }),
  });
  return handleResponse(res);
}

/** Login for all roles. Owners must pass loginKey too. */
export async function loginUser({ username, password, loginKey }) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, loginKey: loginKey || null }),
  });
  return handleResponse(res);
}

// ─── Files (Owner upload + User download) ─────────────────────────────────────

export async function getMyFiles() {
  const res = await fetch(`${BASE_URL}/files`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function uploadFile(formData) {
  const res = await fetch(`${BASE_URL}/files/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  return handleResponse(res);
}

export async function requestDownloadKey(id) {
  const res = await fetch(`${BASE_URL}/files/request-download-key/${id}`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function downloadFile(id, code) {
  const res = await fetch(
    `${BASE_URL}/files/download/${id}?code=${encodeURIComponent(code)}`,
    { headers: { Authorization: `Bearer ${getToken()}` } }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.blob();
}

export async function requestSecureCredential({ originalName, mimeType, sizeBytes }) {
  const res = await fetch(`${BASE_URL}/files/secure/request-credential`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ originalName, mimeType, sizeBytes }),
  });
  return handleResponse(res);
}

export async function getSecurityStatus() {
  const res = await fetch(`${BASE_URL}/files/security-status`);
  return handleResponse(res);
}

export async function requestVulnerableCredential() {
  const res = await fetch(`${BASE_URL}/files/vulnerable/request-credential`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}

// ─── User — Browse & Request Access ───────────────────────────────────────────

/** Browse all files available to request (any logged-in user). */
export async function browseFiles(search = "") {
  const url = search
    ? `${BASE_URL}/userrequest/files/browse?search=${encodeURIComponent(search)}`
    : `${BASE_URL}/userrequest/files/browse`;
  const res = await fetch(url, { headers: authHeaders() });
  return handleResponse(res);
}

/** Submit a request to access a specific file. */
export async function requestFileAccess(fileId) {
  const res = await fetch(`${BASE_URL}/userrequest/request-access/${fileId}`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

/** Get the logged-in user's own file access requests. */
export async function getMyRequests() {
  const res = await fetch(`${BASE_URL}/userrequest/my-requests`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ─── Owner — Access Request Management ────────────────────────────────────────

/** Get all access requests for the logged-in owner's files. */
export async function getOwnerAccessRequests() {
  const res = await fetch(`${BASE_URL}/owner/access-requests`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

/** Approve a user's file access request. */
export async function approveAccessRequest(requestId) {
  const res = await fetch(`${BASE_URL}/owner/approve-request/${requestId}`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

/** Reject a user's file access request. */
export async function rejectAccessRequest(requestId) {
  const res = await fetch(`${BASE_URL}/owner/reject-request/${requestId}`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ─── Admin ────────────────────────────────────────────────────────────────────

/** Get owners waiting for approval. */
export async function getPendingOwners() {
  const res = await fetch(`${BASE_URL}/admin/pending-owners`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

/** Get all owners (all statuses). */
export async function getAllOwners() {
  const res = await fetch(`${BASE_URL}/admin/owners`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

/** Get all regular users. */
export async function getAllUsers() {
  const res = await fetch(`${BASE_URL}/admin/users`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

/** Get all files (admin view). */
export async function getAllFiles() {
  const res = await fetch(`${BASE_URL}/admin/files`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

/** Approve an owner registration. */
export async function approveOwner(ownerId) {
  const res = await fetch(`${BASE_URL}/admin/approve-owner/${ownerId}`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

/** Reject an owner registration. */
export async function rejectOwner(ownerId) {
  const res = await fetch(`${BASE_URL}/admin/reject-owner/${ownerId}`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ─── Email / Audit ─────────────────────────────────────────────────────────────

export async function getMockEmails() {
  const res = await fetch(`${BASE_URL}/email/inbox`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getAuditLogs() {
  const res = await fetch(`${BASE_URL}/audit`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}
