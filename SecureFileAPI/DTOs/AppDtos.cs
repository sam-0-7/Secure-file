using System.ComponentModel.DataAnnotations;

namespace SecureFileAPI.DTOs;

// ─── Auth ─────────────────────────────────────────────────────────────────────

public class RegisterDto
{
    [Required]
    [MinLength(3, ErrorMessage = "Username must be at least 3 characters.")]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress(ErrorMessage = "Invalid email address.")]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
    public string Password { get; set; } = string.Empty;

    /// <summary>Role: "User", "Owner", or "Admin"</summary>
    public string Role { get; set; } = "User";
}

public class LoginDto
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    /// <summary>Required for Owner login only (sent by admin email on approval).</summary>
    public string? LoginKey { get; set; }
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

// ─── Files ────────────────────────────────────────────────────────────────────

public class FileInfoDto
{
    public int Id { get; set; }
    public string OriginalName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public bool IsEncrypted { get; set; }
    public string EncryptionIV { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
    public string UploadedBy { get; set; } = string.Empty;
    public int UploadedByUserId { get; set; }
}

// ─── Audit ────────────────────────────────────────────────────────────────────

public class AuditLogDto
{
    public int Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string? FileName { get; set; }
    public string? IpAddress { get; set; }
    public string? Details { get; set; }
    public DateTime Timestamp { get; set; }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

public class UserSummaryDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

// ─── File Access Requests ─────────────────────────────────────────────────────

public class FileAccessRequestDto
{
    public int Id { get; set; }
    public int FileRecordId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OwnerUsername { get; set; } = string.Empty;
    public string RequestingUsername { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; }
}
