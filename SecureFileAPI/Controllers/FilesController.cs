using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureFileAPI.Data;
using SecureFileAPI.DTOs;
using SecureFileAPI.Models;
using SecureFileAPI.Services;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace SecureFileAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuditService _auditService;
    private readonly IConfiguration _config;
    private readonly FileEncryptionService _fileEncryptionService;
    private readonly EmailService _emailService;

    public FilesController(AppDbContext db, AuditService auditService, IConfiguration config, FileEncryptionService fileEncryptionService, EmailService emailService)
    {
        _db = db;
        _auditService = auditService;
        _config = config;
        _fileEncryptionService = fileEncryptionService;
        _emailService = emailService;
    }

    /// <summary>
    /// Returns whether the API is running in Full Security Mode or Demo Mode.
    /// </summary>
    [HttpGet("security-status")]
    [AllowAnonymous]
    public IActionResult GetSecurityStatus()
    {
        var securityMode = _config["SecurityMode"] ?? "Demo";
        return Ok(new { SecurityMode = securityMode });
    }

    /// <summary>
    /// VULNERABLE: Generates an upload credential without restrictions (V1, V2, V3, V4).
    /// </summary>
    [HttpPost("vulnerable/request-credential")]
    [AllowAnonymous] // V1: Unrestricted Acquisition
    public IActionResult RequestVulnerableCredential()
    {
        var securityMode = _config["SecurityMode"] ?? "Demo";
        if (string.Equals(securityMode, "Full", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Vulnerable endpoints are disabled in Full Security Mode." });
        }

        var credential = new
        {
            UploadUrl = $"{Request.Scheme}://{Request.Host}/api/cloudstorage/upload",
            Token = "vulnerable-static-token",
            Expires = DateTime.UtcNow.AddDays(2), // V2: Long validity
            AllowedTypes = "*", // V3: Unrestricted file types
            MaxSize = "Unlimited" // V3: Unrestricted size
        };

        return Ok(credential);
    }

    /// <summary>
    /// SECURE: Generates a secure, signed upload credential.
    /// Mitigates V1, V2, V3, V4.
    /// </summary>
    [HttpPost("secure/request-credential")]
    public async Task<IActionResult> RequestSecureCredential([FromBody] FileUploadRequestDto request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // Mitigation for V3: Restrict File Types and Sizes
        var allowedTypes = new[] { "image/jpeg", "image/png", "application/pdf" };
        if (!allowedTypes.Contains(request.MimeType))
            return BadRequest("File type not allowed.");

        if (request.SizeBytes > 10 * 1024 * 1024) // 10 MB limit
            return BadRequest("File too large.");

        var storedName = Guid.NewGuid().ToString() + Path.GetExtension(request.OriginalName);
        var expiry = DateTimeOffset.UtcNow.AddMinutes(5).ToUnixTimeSeconds(); // Mitigation V2: Short validity

        // Create Signature for the policy (Mitigation V4: Prevent Overwriting by binding filename to signature)
        var secretKey = _config["CloudStorage:SecretKey"];
        var payload = $"{userId}:{storedName}:{request.SizeBytes}:{expiry}";
        var signature = GenerateSignature(payload, secretKey!);

        await _auditService.LogAsync("RequestSecureCredential", userId, storedName, "Requested upload credential");

        var credential = new
        {
            UploadUrl = $"{Request.Scheme}://{Request.Host}/api/cloudstorage/secure-upload",
            StoredName = storedName,
            Expires = expiry,
            Signature = signature
        };

        return Ok(credential);
    }

    /// <summary>
    /// Callback from Cloud Storage after file upload.
    /// SECURE: Verifies signature (Mitigates V6: Callback Notification Spoofing).
    /// </summary>
    [HttpPost("secure/callback")]
    [AllowAnonymous]
    public async Task<IActionResult> SecureCallback([FromBody] CloudStorageCallbackDto callback)
    {
        var secretKey = _config["CloudStorage:SecretKey"];
        var payload = $"{callback.StoredName}:{callback.SizeBytes}:{callback.Status}";
        var expectedSignature = GenerateSignature(payload, secretKey!);

        if (callback.Signature != expectedSignature)
        {
            await _auditService.LogAsync("CallbackSpoofingAttempt", null, callback.StoredName, "Invalid callback signature");
            return Unauthorized("Invalid signature.");
        }

        var fileRecord = new FileRecord
        {
            OriginalName = callback.OriginalName,
            StoredName = callback.StoredName,
            MimeType = callback.MimeType,
            SizeBytes = callback.SizeBytes,
            IsEncrypted = false, // In this demo, the cloud storage didn't encrypt it, or we rely on the DB tracking
            UploadedByUserId = callback.UserId
        };

        _db.FileRecords.Add(fileRecord);
        await _db.SaveChangesAsync();

        await _auditService.LogAsync("FileUploadCompleted", callback.UserId, callback.StoredName, "File uploaded successfully via secure callback");

        return Ok();
    }

    [HttpGet]
    public async Task<IActionResult> GetMyFiles()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var files = await _db.FileRecords
            .Where(f => !f.IsDeleted)
            .Select(f => new FileInfoDto
            {
                Id = f.Id,
                OriginalName = f.OriginalName,
                MimeType = f.MimeType,
                SizeBytes = f.SizeBytes,
                IsEncrypted = f.IsEncrypted,
                UploadedAt = f.UploadedAt,
                UploadedBy = f.UploadedByUser!.Username
            })
            .ToListAsync();

        return Ok(files);
    }

    /// <summary>
    /// SECURE: Uploads and encrypts a file on disk (Mitigates V5: Lack of Encryption-at-Rest).
    /// Enforces Admin-only upload capability.
    /// </summary>
    [HttpPost("upload")]
    [Authorize(Roles = "Admin,Owner")]
    public async Task<IActionResult> UploadFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        // Limit size and type to avoid malicious uploads
        var allowedTypes = new[] { "image/jpeg", "image/png", "application/pdf" };
        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest("File type not allowed. Only JPEG, PNG, and PDF are allowed.");

        if (file.Length > 10 * 1024 * 1024) // 10 MB Limit
            return BadRequest("File size exceeds 10 MB limit.");

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var storedName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
        
        var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "UploadedFiles");
        if (!Directory.Exists(uploadDir))
        {
            Directory.CreateDirectory(uploadDir);
        }
        
        var filePath = Path.Combine(uploadDir, storedName);
        string iv = string.Empty;

        // Encrypt and write to disk
        using (var sourceStream = file.OpenReadStream())
        using (var destinationStream = new FileStream(filePath, FileMode.Create, FileAccess.Write))
        {
            iv = await _fileEncryptionService.EncryptAsync(sourceStream, destinationStream);
        }

        var fileRecord = new FileRecord
        {
            OriginalName = file.FileName,
            StoredName = storedName,
            MimeType = file.ContentType,
            SizeBytes = file.Length,
            IsEncrypted = true,
            EncryptionIV = iv,
            UploadedByUserId = userId
        };

        _db.FileRecords.Add(fileRecord);
        await _db.SaveChangesAsync();

        await _auditService.LogAsync("FileUpload", userId, storedName, $"File uploaded and encrypted successfully: {file.FileName}");

        return Ok(new { message = "File uploaded and encrypted successfully.", fileId = fileRecord.Id });
    }

    /// <summary>
    /// SECURE: Generates a verification code (OTP) to download a file and simulates email dispatch.
    /// </summary>
    [HttpPost("request-download-key/{id}")]
    public async Task<IActionResult> RequestDownloadKey(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var userEmail = User.FindFirstValue(ClaimTypes.Email)!;
        var username = User.FindFirstValue(ClaimTypes.Name) ?? "User";

        var fileRecord = await _db.FileRecords.FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);
        if (fileRecord == null)
            return NotFound("File record not found.");

        // Expire any existing active codes for this user and file
        var existingCodes = await _db.FileVerificationCodes
            .Where(c => c.UserId == userId && c.FileRecordId == id && !c.IsUsed && c.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();
            
        foreach (var c in existingCodes)
        {
            c.ExpiresAt = DateTime.UtcNow; // Force expire
        }

        var codeStr = GenerateRandomVerificationKey();
        var verificationCode = new FileVerificationCode
        {
            FileRecordId = id,
            UserId = userId,
            Code = codeStr,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            IsUsed = false
        };

        _db.FileVerificationCodes.Add(verificationCode);

        // Simulate email sending by logging and saving to MockEmails table
        var email = new MockEmail
        {
            ToEmail = userEmail,
            Subject = "SecureFile Download Verification Key",
            Body = $@"Hello {username},

You have requested to download the file '{fileRecord.OriginalName}'.
Please use the following verification key to authorize the request:

Verification Key: {codeStr}

This key is valid for 5 minutes and can only be used once. If you did not request this, please change your password immediately.

SecureFile Security Team"
        };
        _db.MockEmails.Add(email);

        await _db.SaveChangesAsync();

        // Send real SMTP email
        await _emailService.SendEmailAsync(userEmail, email.Subject, email.Body);

        await _auditService.LogAsync("DownloadKeyRequest", userId, fileRecord.StoredName, $"Verification key generated and emailed to: {userEmail}");

        return Ok(new { message = "Verification key sent to your email." });
    }

    /// <summary>
    /// SECURE: Decrypts and downloads a file, requiring validation of the verification key.
    /// </summary>
    [HttpGet("download/{id}")]
    public async Task<IActionResult> DownloadFile(int id, [FromQuery] string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            return BadRequest("Verification key code is required to access the file.");

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var fileRecord = await _db.FileRecords
            .Include(f => f.UploadedByUser)
            .FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);

        if (fileRecord == null)
            return NotFound("File record not found.");

        // Validate the code
        var verification = await _db.FileVerificationCodes
            .FirstOrDefaultAsync(c => c.FileRecordId == id && 
                                      c.UserId == userId && 
                                      c.Code == code && 
                                      !c.IsUsed && 
                                      c.ExpiresAt > DateTime.UtcNow);

        if (verification == null)
        {
            await _auditService.LogAsync("UnauthorizedFileAccessAttempt", userId, fileRecord.StoredName, $"Invalid or expired download verification key submitted: '{code}'");
            return BadRequest("Invalid or expired download verification key.");
        }

        // Mark code as used
        verification.IsUsed = true;
        await _db.SaveChangesAsync();

        var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "UploadedFiles");
        var filePath = Path.Combine(uploadDir, fileRecord.StoredName);

        if (!System.IO.File.Exists(filePath))
            return NotFound("File not found on disk.");

        var decryptedStream = new MemoryStream();
        try
        {
            using (var encryptedStream = new FileStream(filePath, FileMode.Open, FileAccess.Read))
            {
                await _fileEncryptionService.DecryptAsync(encryptedStream, decryptedStream);
            }
        }
        catch (Exception ex)
        {
            await _auditService.LogAsync("DecryptionError", userId, fileRecord.StoredName, $"Failed to decrypt file: {ex.Message}");
            return StatusCode(500, "Failed to decrypt the file.");
        }

        decryptedStream.Position = 0;

        await _auditService.LogAsync("FileDownload", userId, fileRecord.StoredName, $"Downloaded file: {fileRecord.OriginalName}");

        return File(decryptedStream, fileRecord.MimeType, fileRecord.OriginalName);
    }

    private string GenerateRandomVerificationKey()
    {
        var bytes = new byte[4];
        using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
        {
            rng.GetBytes(bytes);
        }
        var val = BitConverter.ToUInt32(bytes, 0) % 1000000;
        return $"SF-{val:D6}";
    }

    private string GenerateSignature(string payload, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToBase64String(hash);
    }
}

public class FileUploadRequestDto
{
    public string OriginalName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
}

public class CloudStorageCallbackDto
{
    public string OriginalName { get; set; } = string.Empty;
    public string StoredName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string Status { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string Signature { get; set; } = string.Empty;
}
