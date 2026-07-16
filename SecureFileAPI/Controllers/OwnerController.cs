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
/// Owner-specific endpoints: view and respond to user file access requests.
/// Only accessible by users with Role=Owner.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Owner")]
public class OwnerController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuditService _auditService;
    private readonly EmailService _emailService;

    public OwnerController(AppDbContext db, AuditService auditService, EmailService emailService)
    {
        _db = db;
        _auditService = auditService;
        _emailService = emailService;
    }

    private int GetOwnerId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Get all pending access requests for files owned by the logged-in owner.</summary>
    [HttpGet("access-requests")]
    public async Task<IActionResult> GetAccessRequests()
    {
        var ownerId = GetOwnerId();

        var requests = await _db.FileAccessRequests
            .Include(r => r.FileRecord)
            .Include(r => r.RequestingUser)
            .Where(r => r.OwnerId == ownerId)
            .OrderByDescending(r => r.RequestedAt)
            .Select(r => new FileAccessRequestDto
            {
                Id = r.Id,
                FileRecordId = r.FileRecordId,
                FileName = r.FileRecord != null ? r.FileRecord.OriginalName : "",
                OwnerUsername = User.FindFirstValue(ClaimTypes.Name) ?? "",
                RequestingUsername = r.RequestingUser != null ? r.RequestingUser.Username : "",
                Status = r.Status,
                RequestedAt = r.RequestedAt
            })
            .ToListAsync();

        return Ok(requests);
    }

    /// <summary>Get only pending (waiting) access requests for this owner.</summary>
    [HttpGet("access-requests/pending")]
    public async Task<IActionResult> GetPendingAccessRequests()
    {
        var ownerId = GetOwnerId();

        var requests = await _db.FileAccessRequests
            .Include(r => r.FileRecord)
            .Include(r => r.RequestingUser)
            .Where(r => r.OwnerId == ownerId && r.Status == "waiting")
            .OrderByDescending(r => r.RequestedAt)
            .Select(r => new FileAccessRequestDto
            {
                Id = r.Id,
                FileRecordId = r.FileRecordId,
                FileName = r.FileRecord != null ? r.FileRecord.OriginalName : "",
                OwnerUsername = User.FindFirstValue(ClaimTypes.Name) ?? "",
                RequestingUsername = r.RequestingUser != null ? r.RequestingUser.Username : "",
                Status = r.Status,
                RequestedAt = r.RequestedAt
            })
            .ToListAsync();

        return Ok(requests);
    }

    /// <summary>
    /// Approve a user's file access request.
    /// Sends both the file's encrypted key and the owner's AES key to the user via mock email.
    /// The user can then use these to decrypt and download the file.
    /// </summary>
    [HttpPost("approve-request/{requestId}")]
    public async Task<IActionResult> ApproveRequest(int requestId)
    {
        var ownerId = GetOwnerId();

        var request = await _db.FileAccessRequests
            .Include(r => r.FileRecord)
            .Include(r => r.RequestingUser)
            .FirstOrDefaultAsync(r => r.Id == requestId && r.OwnerId == ownerId);

        if (request == null)
            return NotFound(new { message = "Access request not found." });

        if (request.Status != "waiting")
            return BadRequest(new { message = $"Request is already {request.Status}." });

        // Get owner's AES key
        var owner = await _db.Users.FindAsync(ownerId);
        if (owner == null) return NotFound(new { message = "Owner not found." });

        // The file's encryption IV (acts as the public key identifier in this system)
        var fileIv = request.FileRecord?.EncryptionIV ?? "";
        var fileName = request.FileRecord?.OriginalName ?? "";
        var userEmail = request.RequestingUser?.Email ?? "";
        var username = request.RequestingUser?.Username ?? "";
        var fileId = request.FileRecordId;

        request.Status = "Approved";
        request.RespondedAt = DateTime.UtcNow;

        // Generate a one-time download verification code for this approval
        var verificationCode = $"SF-{Random.Shared.Next(100000, 999999):D6}";
        var verificationRecord = new FileVerificationCode
        {
            FileRecordId = fileId,
            UserId = request.RequestingUserId,
            Code = verificationCode,
            ExpiresAt = DateTime.UtcNow.AddHours(24), // 24 hours after owner approval
            IsUsed = false
        };
        _db.FileVerificationCodes.Add(verificationRecord);

        // Send mock email with the verification code
        var email = new MockEmail
        {
            ToEmail = userEmail,
            Subject = $"PASSPCloud — File Access Approved: {fileName}",
            Body = $@"Hello {username},

Your request to access the file '{fileName}' has been approved by the owner.

Use the following verification code to download the file from the Download page:

Verification Code: {verificationCode}

This code is valid for 24 hours and can only be used once.

Go to the Download page, find your approved request, click Download, and enter this code.

PASSPCloud Security Team"
        };
        _db.MockEmails.Add(email);

        await _db.SaveChangesAsync();

        // Send real SMTP email
        await _emailService.SendEmailAsync(userEmail, email.Subject, email.Body);

        await _auditService.LogAsync("ApproveFileAccess", ownerId, fileName,
            $"Owner approved file access for user '{username}'. Verification code emailed.");

        return Ok(new { message = $"Access approved. Verification code sent to {userEmail}." });
    }

    /// <summary>Reject a user's file access request.</summary>
    [HttpPost("reject-request/{requestId}")]
    public async Task<IActionResult> RejectRequest(int requestId)
    {
        var ownerId = GetOwnerId();

        var request = await _db.FileAccessRequests
            .Include(r => r.FileRecord)
            .Include(r => r.RequestingUser)
            .FirstOrDefaultAsync(r => r.Id == requestId && r.OwnerId == ownerId);

        if (request == null)
            return NotFound(new { message = "Access request not found." });

        if (request.Status != "waiting")
            return BadRequest(new { message = $"Request is already {request.Status}." });

        request.Status = "Rejected";
        request.RespondedAt = DateTime.UtcNow;

        var userEmail = request.RequestingUser?.Email ?? "";
        var username = request.RequestingUser?.Username ?? "";
        var fileName = request.FileRecord?.OriginalName ?? "";

        var email = new MockEmail
        {
            ToEmail = userEmail,
            Subject = "PASSPCloud — File Access Request Update",
            Body = $@"Hello {username},

Your request to access the file '{fileName}' was not approved by the owner at this time.

PASSPCloud Security Team"
        };
        _db.MockEmails.Add(email);

        await _db.SaveChangesAsync();

        // Send real SMTP email
        await _emailService.SendEmailAsync(userEmail, email.Subject, email.Body);

        await _auditService.LogAsync("RejectFileAccess", ownerId, fileName,
            $"Owner rejected file access for user '{username}'.");

        return Ok(new { message = "Request rejected." });
    }
}
