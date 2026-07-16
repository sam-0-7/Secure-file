namespace SecureFileAPI.Models;

public class AuditLog
{
    public int Id { get; set; }
    public string Action { get; set; } = string.Empty;     // Upload, Download, Delete, Login, FailedLogin, Register
    public string? FileName { get; set; }
    public string? IpAddress { get; set; }
    public string? Details { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Foreign key
    public int? UserId { get; set; }
    public User? User { get; set; }
}
