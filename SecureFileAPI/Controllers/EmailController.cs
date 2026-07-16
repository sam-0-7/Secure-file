using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureFileAPI.Data;
using SecureFileAPI.Models;
using System.Security.Claims;

namespace SecureFileAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmailController : ControllerBase
{
    private readonly AppDbContext _db;

    public EmailController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("inbox")]
    public async Task<IActionResult> GetInbox()
    {
        var userEmail = User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrEmpty(userEmail))
            return BadRequest("User email not found in token claims.");

        var emails = await _db.MockEmails
            .Where(e => e.ToEmail.ToLower() == userEmail.ToLower())
            .OrderByDescending(e => e.SentAt)
            .ToListAsync();

        return Ok(emails);
    }
}
