using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureFileAPI.Data;
using SecureFileAPI.DTOs;
using SecureFileAPI.Models;
using SecureFileAPI.Services;
using System.Security.Cryptography;

namespace SecureFileAPI.Controllers;

/// <summary>
/// Server Admin endpoints: approve/reject owners, view all users/files.
/// Only accessible by users with Role=Admin.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuditService _auditService;
    private readonly EmailService _emailService;

    public AdminController(AppDbContext db, AuditService auditService, EmailService emailService)
    {
        _db = db;
        _auditService = auditService;
        _emailService = emailService;
    }

    /// <summary>Get all owners waiting for approval.</summary>
    [HttpGet("pending-owners")]
    public async Task<IActionResult> GetPendingOwners()
    {
        var owners = await _db.Users
            .Where(u => u.Role == "Owner" && u.Status == "waiting")
            .Select(u => new UserSummaryDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                Role = u.Role,
                Status = u.Status,
                CreatedAt = u.CreatedAt
            })
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        return Ok(owners);
    }

    /// <summary>Get all owners (waiting + active + rejected).</summary>
    [HttpGet("owners")]
    public async Task<IActionResult> GetAllOwners()
    {
        var owners = await _db.Users
            .Where(u => u.Role == "Owner")
            .Select(u => new UserSummaryDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                Role = u.Role,
                Status = u.Status,
                CreatedAt = u.CreatedAt
            })
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        return Ok(owners);
    }

    /// <summary>Get all regular users.</summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _db.Users
            .Where(u => u.Role == "User")
            .Select(u => new UserSummaryDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                Role = u.Role,
                Status = u.Status,
                CreatedAt = u.CreatedAt
            })
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>Get all uploaded files (admin overview).</summary>
    [HttpGet("files")]
    public async Task<IActionResult> GetAllFiles()
    {
        var files = await _db.FileRecords
            .Where(f => !f.IsDeleted)
            .Include(f => f.UploadedByUser)
            .Select(f => new FileInfoDto
            {
                Id = f.Id,
                OriginalName = f.OriginalName,
                MimeType = f.MimeType,
                SizeBytes = f.SizeBytes,
                IsEncrypted = f.IsEncrypted,
                EncryptionIV = f.EncryptionIV,
                UploadedAt = f.UploadedAt,
                UploadedBy = f.UploadedByUser != null ? f.UploadedByUser.Username : "unknown",
                UploadedByUserId = f.UploadedByUserId
            })
            .OrderByDescending(f => f.UploadedAt)
            .ToListAsync();

        return Ok(files);
    }

    /// <summary>
    /// Approve an owner registration.
    /// Generates a 4-digit login key and a 256-bit AES encryption key,
    /// saves them on the user, and sends a mock email notification.
    /// </summary>
    [HttpPost("approve-owner/{id}")]
    public async Task<IActionResult> ApproveOwner(int id)
    {
        var owner = await _db.Users.FindAsync(id);
        if (owner == null || owner.Role != "Owner")
            return NotFound(new { message = "Owner not found." });

        if (owner.Status == "Active")
            return BadRequest(new { message = "Owner is already approved." });

        // Generate 4-digit login key
        var loginKey = Random.Shared.Next(1111, 9999).ToString();

        // Generate AES-256 key (hex encoded)
        var aesKeyBytes = RandomNumberGenerator.GetBytes(32);
        var encKeyHex = Convert.ToHexString(aesKeyBytes).ToLower();

        owner.Status = "Active";
        owner.LoginKey = loginKey;
        owner.EncKey = encKeyHex;

        // Send mock email
        var email = new MockEmail
        {
            ToEmail = owner.Email,
            Subject = "PASSPCloud — Your Owner Account Has Been Approved!",
            Body = $@"Hello {owner.Username},

Your owner account registration has been approved by the server admin.

Your Login Key: {loginKey}

Use this key along with your username and password to log in as an owner.
Keep this key safe — it is required every time you log in.

PASSPCloud Security Team"
        };
        _db.MockEmails.Add(email);
        await _db.SaveChangesAsync();

        // Send real SMTP email
        await _emailService.SendEmailAsync(owner.Email, email.Subject, email.Body);

        await _auditService.LogAsync("ApproveOwner", details: $"Owner approved: {owner.Username}. Login key generated and emailed.");

        return Ok(new { message = $"Owner '{owner.Username}' approved. Login key sent to {owner.Email}.", loginKey });
    }

    /// <summary>Reject an owner registration.</summary>
    [HttpPost("reject-owner/{id}")]
    public async Task<IActionResult> RejectOwner(int id)
    {
        var owner = await _db.Users.FindAsync(id);
        if (owner == null || owner.Role != "Owner")
            return NotFound(new { message = "Owner not found." });

        owner.Status = "rejected";

        var email = new MockEmail
        {
            ToEmail = owner.Email,
            Subject = "PASSPCloud — Owner Registration Update",
            Body = $@"Hello {owner.Username},

Unfortunately, your owner account registration has been rejected by the server admin.

If you believe this is an error, please contact support.

PASSPCloud Security Team"
        };
        _db.MockEmails.Add(email);
        await _db.SaveChangesAsync();

        // Send real SMTP email
        await _emailService.SendEmailAsync(owner.Email, email.Subject, email.Body);

        await _auditService.LogAsync("RejectOwner", details: $"Owner rejected: {owner.Username}.");

        return Ok(new { message = $"Owner '{owner.Username}' rejected." });
    }

    /// <summary>Get all file access requests (admin overview).</summary>
    [HttpGet("access-requests")]
    public async Task<IActionResult> GetAllAccessRequests()
    {
        var requests = await _db.FileAccessRequests
            .Include(r => r.FileRecord)
            .Include(r => r.Owner)
            .Include(r => r.RequestingUser)
            .OrderByDescending(r => r.RequestedAt)
            .Select(r => new FileAccessRequestDto
            {
                Id = r.Id,
                FileRecordId = r.FileRecordId,
                FileName = r.FileRecord != null ? r.FileRecord.OriginalName : "",
                OwnerUsername = r.Owner != null ? r.Owner.Username : "",
                RequestingUsername = r.RequestingUser != null ? r.RequestingUser.Username : "",
                Status = r.Status,
                RequestedAt = r.RequestedAt
            })
            .ToListAsync();

        return Ok(requests);
    }
}
