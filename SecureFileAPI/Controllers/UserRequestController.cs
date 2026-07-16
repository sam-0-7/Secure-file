using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureFileAPI.Data;
using SecureFileAPI.DTOs;
using SecureFileAPI.Models;
using SecureFileAPI.Services;
using System.Security.Claims;

namespace SecureFileAPI.Controllers;

/// <summary>
/// User-specific endpoints: browse files, request access, track request status.
/// Accessible by any authenticated user.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserRequestController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuditService _auditService;

    public UserRequestController(AppDbContext db, AuditService auditService)
    {
        _db = db;
        _auditService = auditService;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Browse all available files (for users to find files they want to request).</summary>
    [HttpGet("files/browse")]
    public async Task<IActionResult> BrowseFiles([FromQuery] string? search = null)
    {
        var query = _db.FileRecords
            .Where(f => !f.IsDeleted)
            .Include(f => f.UploadedByUser)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(f =>
                f.OriginalName.ToLower().Contains(search) ||
                (f.UploadedByUser != null && f.UploadedByUser.Username.ToLower().Contains(search)));
        }

        var files = await query
            .OrderByDescending(f => f.UploadedAt)
            .Select(f => new FileInfoDto
            {
                Id = f.Id,
                OriginalName = f.OriginalName,
                MimeType = f.MimeType,
                SizeBytes = f.SizeBytes,
                IsEncrypted = f.IsEncrypted,
                UploadedAt = f.UploadedAt,
                UploadedBy = f.UploadedByUser != null ? f.UploadedByUser.Username : "unknown",
                UploadedByUserId = f.UploadedByUserId
            })
            .ToListAsync();

        return Ok(files);
    }

    /// <summary>
    /// Request access to a specific file.
    /// Creates a FileAccessRequest with Status=waiting for the owner to approve.
    /// </summary>
    [HttpPost("request-access/{fileId}")]
    public async Task<IActionResult> RequestAccess(int fileId)
    {
        var userId = GetUserId();

        var file = await _db.FileRecords
            .Include(f => f.UploadedByUser)
            .FirstOrDefaultAsync(f => f.Id == fileId && !f.IsDeleted);

        if (file == null)
            return NotFound(new { message = "File not found." });

        // Check for duplicate pending request
        var existing = await _db.FileAccessRequests
            .AnyAsync(r => r.FileRecordId == fileId && r.RequestingUserId == userId &&
                           r.Status == "waiting");

        if (existing)
            return BadRequest(new { message = "You already have a pending request for this file." });

        var alreadyApproved = await _db.FileAccessRequests
            .AnyAsync(r => r.FileRecordId == fileId && r.RequestingUserId == userId &&
                           r.Status == "Approved");

        if (alreadyApproved)
            return BadRequest(new { message = "Your access to this file has already been approved." });

        var request = new FileAccessRequest
        {
            FileRecordId = fileId,
            OwnerId = file.UploadedByUserId,
            RequestingUserId = userId,
            Status = "waiting"
        };

        _db.FileAccessRequests.Add(request);
        await _db.SaveChangesAsync();

        await _auditService.LogAsync("RequestFileAccess", userId, file.OriginalName,
            $"User requested access to file: {file.OriginalName} (owned by: {file.UploadedByUser?.Username})");

        return Ok(new { message = "Access request submitted. The file owner will review your request." });
    }

    /// <summary>Get all file access requests made by the logged-in user.</summary>
    [HttpGet("my-requests")]
    public async Task<IActionResult> GetMyRequests()
    {
        var userId = GetUserId();

        var requests = await _db.FileAccessRequests
            .Include(r => r.FileRecord)
            .Include(r => r.Owner)
            .Where(r => r.RequestingUserId == userId)
            .OrderByDescending(r => r.RequestedAt)
            .Select(r => new FileAccessRequestDto
            {
                Id = r.Id,
                FileRecordId = r.FileRecordId,
                FileName = r.FileRecord != null ? r.FileRecord.OriginalName : "",
                OwnerUsername = r.Owner != null ? r.Owner.Username : "",
                RequestingUsername = User.FindFirstValue(ClaimTypes.Name) ?? "",
                Status = r.Status,
                RequestedAt = r.RequestedAt
            })
            .ToListAsync();

        return Ok(requests);
    }
}
