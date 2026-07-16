namespace SecureFileAPI.Models;

public class FileRecord
{
    public int Id { get; set; }
    public string OriginalName { get; set; } = string.Empty;     // Original filename from user
    public string StoredName { get; set; } = string.Empty;       // GUID-based stored filename
    public string MimeType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public bool IsEncrypted { get; set; } = true;
    public string EncryptionIV { get; set; } = string.Empty;     // IV used for AES-256
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;

    // Foreign key
    public int UploadedByUserId { get; set; }
    public User? UploadedByUser { get; set; }
}
