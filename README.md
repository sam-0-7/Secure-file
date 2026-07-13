# 🔐 PASSPCloud — Secure File Management System

A full-stack, security-focused file management platform that demonstrates real-world cloud storage vulnerabilities and their mitigations. Built as an academic/research project to explore OWASP-class threats in file upload systems.

---

## 📖 Project Overview

PASSPCloud is a multi-role secure file management system where:

- **Admins** manage the platform, approve/reject Owner registrations, and have full file visibility.
- **Owners** upload and manage encrypted files, and control user access requests.
- **Users** browse available files, submit access requests, receive OTP verification codes via email, and download decrypted files.

The project intentionally implements **both vulnerable and secure API endpoints** side-by-side, making it an excellent reference for understanding cloud storage security risks (e.g. unrestricted credential issuance, missing encryption-at-rest, callback spoofing) and their proper mitigations.

---

## ✨ Features

### 🔑 Authentication & Authorization
- JWT-based authentication with role-based access control (Admin / Owner / User)
- Owner registration requires **Admin approval** before login is permitted
- Owners authenticate with **username + password + a unique login key** (sent via email on approval)
- BCrypt password hashing

### 📁 File Management
- Admin-only AES-256 **encrypted file uploads** (encryption-at-rest)
- Secure per-request signed upload credentials with short TTL and HMAC-SHA256 signatures
- **Callback notification verification** to prevent spoofing (V6 mitigation)
- File type and size validation (JPEG, PNG, PDF · max 10 MB)
- Soft-delete support

### 🔒 Secure Download Flow
- Users submit access requests for files; Owners approve or reject them
- Upon approval, a **one-time verification code (OTP)** is emailed to the user
- Download requires a valid, unused, non-expired OTP — enforcing MFA-style access
- Files are **decrypted server-side on the fly** and streamed to the client

### 📊 Audit Logging
- Every significant action (login, failed login, upload, download, approval, rejection) is logged with timestamp, user ID, IP address, and details
- Admins can view the full audit trail through the dashboard

### 📧 Email Notifications
- Simulated SMTP email delivery (mock email log stored in DB)
- Real SMTP email support via configurable credentials
- Emails sent for: Owner approval/rejection, download OTP codes, access request updates

### 🆚 Vulnerable vs. Secure Endpoints
- Side-by-side vulnerable (`/api/files/vulnerable/...`) and secure (`/api/files/secure/...`) endpoints
- Demonstrates V1–V6 cloud storage upload vulnerabilities described in the companion research paper

---

## 🛠️ Technologies Used

### Backend
| Technology | Purpose |
|---|---|
| **ASP.NET Core (.NET 10)** | REST API framework |
| **Entity Framework Core 10** | ORM & database migrations |
| **SQLite** | Lightweight relational database |
| **JWT Bearer Authentication** | Stateless auth tokens |
| **BCrypt.Net-Next** | Password hashing |
| **Swashbuckle / Swagger** | API documentation |
| **AES-256 (System.Security.Cryptography)** | File encryption at rest |
| **HMAC-SHA256** | Upload credential signing |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI component framework |
| **Vite 8** | Build tool & dev server |
| **React Router v7** | Client-side routing |
| **Bootstrap 5** | Responsive UI components |

---

## 📸 Screenshots

### Home Page
![Home Page](images%20ex/1_homepage.png)

### Owner Login
![Owner Login](images%20ex/2_owner_login.png)

### Owner Dashboard — Files
![Owner Dashboard Files](images%20ex/3_owner_dashboard_files.png)

### Owner Dashboard — Access Request Inbox
![Owner Dashboard Inbox](images%20ex/4_owner_dashboard_inbox.png)

### Server Admin — Owner Management
![Server Admin Owners](images%20ex/5_server_admin_owners.png)

### Server Admin — File Overview
![Server Admin Files](images%20ex/6_server_admin_files.png)

### User — Download Page
![User Download Page](images%20ex/7_user_download.png)

### Register / Create Account
![Register Page](images%20ex/8_register.png)

---

## 🚀 How to Run the Project

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/) and npm
- Git

---

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd "project 1 secure file"
```

---

### 2. Configure the Backend

Navigate to the API project and update `appsettings.json`:

```json
{
  "Jwt": {
    "Key": "your-secret-key-min-32-chars",
    "Issuer": "SecureFileAPI",
    "Audience": "SecureFileClient"
  },
  "CloudStorage": {
    "SecretKey": "your-cloud-storage-hmac-secret"
  },
  "Email": {
    "Host": "smtp.example.com",
    "Port": 587,
    "Username": "you@example.com",
    "Password": "your-smtp-password",
    "From": "noreply@example.com"
  }
}
```

---

### 3. Run Database Migrations

```bash
cd SecureFileAPI
dotnet ef database update
```

> The database is seeded automatically with a default **Admin** account on first run (see `Program.cs` for seed credentials).

---

### 4. Start the Backend API

```bash
cd SecureFileAPI
dotnet run
```

The API will be available at `https://localhost:7xxx` (check the terminal output).  
Swagger UI is available at: `https://localhost:7xxx/swagger`

---

### 5. Start the Frontend

Open a new terminal:

```bash
cd SecureFileFrontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

### 6. Default Roles & Access

| Role | How to Get Access |
|---|---|
| **Admin** | Pre-seeded in the database. Check `Program.cs` for credentials. |
| **Owner** | Register via `/register` → wait for Admin approval → receive login key by email |
| **User** | Register via `/register` → login immediately, no approval required |

---

## 📚 Related Research

This project was built alongside the research paper:

> *"Understanding the Security Risks of Websites Using Cloud Storage for Direct User File Uploads"*

The paper explores V1–V6 cloud upload vulnerabilities; this codebase serves as a live demonstration platform for those findings.

---

## 📄 License

This project is intended for educational and research purposes.
