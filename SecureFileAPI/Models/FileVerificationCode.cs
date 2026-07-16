using System;

namespace SecureFileAPI.Models;

public class FileVerificationCode
{
    public int Id { get; set; }
    public int FileRecordId { get; set; }
    public FileRecord? FileRecord { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public string Code { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
