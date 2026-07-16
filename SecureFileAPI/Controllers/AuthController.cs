using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureFileAPI.Data;
using SecureFileAPI.DTOs;
using SecureFileAPI.Models;
using SecureFileAPI.Services;

namespace SecureFileAPI.Controllers;

/// <summary>
/// Handles user/owner/admin registration and login.
/// - Users (Role=User) register and are immediately Active.
/// - Owners (Role=Owner) register with Status=waiting and must wait for Admin approval.
/// - Admin (Role=Admin) is seeded in the database.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokenService;
    private readonly AuditService _auditService;

    public AuthController(AppDbContext db, TokenService tokenService, AuditService auditService)
    {
        _db = db;
        _tokenService = tokenService;
        _auditService = auditService;
    }

    /// <summary>
    /// Register a new user or owner account.
    /// Owners start with Status=waiting until an Admin approves them.
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(typeof(object), 400)]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var exists = await _db.Users.AnyAsync(u =>
            u.Username == dto.Username || u.Email == dto.Email);

        if (exists)
            return BadRequest(new { message = "Username or email already exists." });

        var role = dto.Role switch
        {
            "Owner" => "Owner",
            "Admin" => "Admin",
            _ => "User"
        };

        // Owners must wait for admin approval; everyone else is immediately Active
        var status = role == "Owner" ? "waiting" : "Active";

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = role,
            Status = status
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        await _auditService.LogAsync("Register", user.Id, details: $"New {role} registered: {user.Username} (Status: {status})");

        if (role == "Owner")
        {
            return Ok(new { message = "Owner registration submitted. Please wait for admin approval. You will receive a login key by email once approved." });
        }

        // For User role — return token immediately
        var token = _tokenService.GenerateToken(user);
        return Ok(new AuthResponseDto
        {
            Token = token,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role,
            Status = user.Status,
            ExpiresAt = _tokenService.GetExpiry()
        });
    }

    /// <summary>
    /// Login endpoint for all roles.
    /// - Admin: username + password only.
    /// - Owner: username + password + loginKey (sent by admin on approval).
    /// - User: username + password only.
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), 200)]
    [ProducesResponseType(typeof(object), 401)]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == dto.Username);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            await _auditService.LogAsync("FailedLogin", details: $"Failed login attempt for username: {dto.Username}");
            return Unauthorized(new { message = "Invalid username or password." });
        }

        // Owner-specific checks
        if (user.Role == "Owner")
        {
            if (user.Status == "waiting")
            {
                await _auditService.LogAsync("FailedLogin", user.Id, details: $"Owner login blocked: still waiting for admin approval.");
                return Unauthorized(new { message = "Your registration is pending admin approval. Please wait." });
            }

            if (user.Status == "rejected")
            {
                await _auditService.LogAsync("FailedLogin", user.Id, details: $"Owner login blocked: registration was rejected.");
                return Unauthorized(new { message = "Your registration was rejected by the admin." });
            }

            // Validate login key for active owners
            if (string.IsNullOrEmpty(dto.LoginKey) || dto.LoginKey != user.LoginKey)
            {
                await _auditService.LogAsync("FailedLogin", user.Id, details: $"Owner login failed: incorrect login key.");
                return Unauthorized(new { message = "Login key is incorrect. Please check the key sent to your email." });
            }
        }

        await _auditService.LogAsync("Login", user.Id, details: $"User logged in: {user.Username} (Role: {user.Role})");

        var token = _tokenService.GenerateToken(user);
        return Ok(new AuthResponseDto
        {
            Token = token,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role,
            Status = user.Status,
            ExpiresAt = _tokenService.GetExpiry()
        });
    }
}
