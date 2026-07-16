using SecureFileAPI.Data;
using SecureFileAPI.Models;

namespace SecureFileAPI.Services;

/// <summary>
/// Records every security-relevant action in the database.
/// Audit logs are critical for detecting breaches and demonstrating accountability.
/// </summary>
public class AuditService
{
    private readonly AppDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditService(AppDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(string action, int? userId = null, string? fileName = null, string? details = null)
    {
        var ip = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        var log = new AuditLog
        {
            Action = action,
            UserId = userId,
            FileName = fileName,
            IpAddress = ip,
            Details = details,
            Timestamp = DateTime.UtcNow
        };

        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync();
    }
}
