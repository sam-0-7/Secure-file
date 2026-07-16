namespace SecureFileAPI.Models;

/// <summary>
/// Represents a user's request to access (download) a file owned by an Owner.
/// The Owner must approve before the user gets the decryption keys.
/// </summary>
public class FileAccessRequest
{
    public int Id { get; set; }

    /// <summary>The file being requested.</summary>
    public int FileRecordId { get; set; }
    public FileRecord? FileRecord { get; set; }

    /// <summary>The Owner who owns the file.</summary>
    public int OwnerId { get; set; }
    public User? Owner { get; set; }

    /// <summary>The User requesting access.</summary>
    public int RequestingUserId { get; set; }
    public User? RequestingUser { get; set; }

    /// <summary>"waiting", "Approved", "Rejected"</summary>
    public string Status { get; set; } = "waiting";

    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }
}
