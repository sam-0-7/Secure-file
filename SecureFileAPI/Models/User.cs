namespace SecureFileAPI.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>Role: "User", "Owner", or "Admin"</summary>
    public string Role { get; set; } = "User";

    /// <summary>Owner approval status: "waiting", "Active", "rejected". Users are always "Active".</summary>
    public string Status { get; set; } = "Active";

    /// <summary>4-digit OTP sent by admin to owner on approval. Required for owner login.</summary>
    public string LoginKey { get; set; } = string.Empty;

    /// <summary>Hex-encoded AES-256 key assigned to owner on approval. Used to wrap file encryption keys.</summary>
    public string EncKey { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<FileRecord> Files { get; set; } = new List<FileRecord>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    public ICollection<FileAccessRequest> FileAccessRequests { get; set; } = new List<FileAccessRequest>();
}
