using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureFileAPI.Data;
using SecureFileAPI.DTOs;
using System.Security.Claims;

namespace SecureFileAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")] // Only Admins can view audit logs
public class AuditController : ControllerBase
{
    private readonly AppDbContext _db;

    public AuditController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllLogs()
    {
        var logs = await _db.AuditLogs
            .Include(a => a.User)
            .OrderByDescending(a => a.Timestamp)
            .Take(100)
            .Select(a => new AuditLogDto
            {
                Id = a.Id,
                Action = a.Action,
                Username = a.User != null ? a.User.Username : "Anonymous",
                FileName = a.FileName,
                IpAddress = a.IpAddress,
                Details = a.Details,
                Timestamp = a.Timestamp
            })
            .ToListAsync();

        return Ok(logs);
    }
}
