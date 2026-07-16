using Microsoft.EntityFrameworkCore;
using SecureFileAPI.Models;

namespace SecureFileAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<FileRecord> FileRecords => Set<FileRecord>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<FileVerificationCode> FileVerificationCodes => Set<FileVerificationCode>();
    public DbSet<MockEmail> MockEmails => Set<MockEmail>();
    public DbSet<FileAccessRequest> FileAccessRequests => Set<FileAccessRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // User → FileRecords (one-to-many)
        modelBuilder.Entity<FileRecord>()
            .HasOne(f => f.UploadedByUser)
            .WithMany(u => u.Files)
            .HasForeignKey(f => f.UploadedByUserId)
            .OnDelete(DeleteBehavior.Cascade);

        // User → AuditLogs (one-to-many, nullable userId for anonymous events)
        modelBuilder.Entity<AuditLog>()
            .HasOne(a => a.User)
            .WithMany(u => u.AuditLogs)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        // User → FileVerificationCodes
        modelBuilder.Entity<FileVerificationCode>()
            .HasOne(f => f.User)
            .WithMany()
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // FileRecord → FileVerificationCodes
        modelBuilder.Entity<FileVerificationCode>()
            .HasOne(f => f.FileRecord)
            .WithMany()
            .HasForeignKey(f => f.FileRecordId)
            .OnDelete(DeleteBehavior.Cascade);

        // FileAccessRequest → FileRecord
        modelBuilder.Entity<FileAccessRequest>()
            .HasOne(r => r.FileRecord)
            .WithMany()
            .HasForeignKey(r => r.FileRecordId)
            .OnDelete(DeleteBehavior.Cascade);

        // FileAccessRequest → Owner (User)
        modelBuilder.Entity<FileAccessRequest>()
            .HasOne(r => r.Owner)
            .WithMany()
            .HasForeignKey(r => r.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        // FileAccessRequest → RequestingUser (User)
        modelBuilder.Entity<FileAccessRequest>()
            .HasOne(r => r.RequestingUser)
            .WithMany(u => u.FileAccessRequests)
            .HasForeignKey(r => r.RequestingUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username).IsUnique();
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email).IsUnique();

        // ─── Seed Data ────────────────────────────────────────────────────────
        // Admin (Server): username=admin, password=Admin@123
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            Username = "admin",
            Email = "admin@securefile.com",
            PasswordHash = "$2a$11$s5VGpGHpTcbBt0OGvOfSHuVbm8VBN73yXIvdmjhXJuZ0DzFJ9Pzmy",
            Role = "Admin",
            Status = "Active",
            LoginKey = "",
            EncKey = "",
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        // Sample Owner: username=mark, password=mark, loginkey=3751 (pre-approved)
        // Password hash for "mark"
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 2,
            Username = "mark",
            Email = "mark@example.com",
            PasswordHash = "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnImaS6H6ey", // "mark"
            Role = "Owner",
            Status = "Active",
            LoginKey = "3751",
            EncKey = "db954de9f08573297b324aedfb4f4df0f70b716956fdafed635ea0f8678eaf84",
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        // Sample User: username=Kumar, password=Kumar
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 3,
            Username = "Kumar",
            Email = "kumar@example.com",
            PasswordHash = "$2a$11$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.", // "Kumar"  
            Role = "User",
            Status = "Active",
            LoginKey = "",
            EncKey = "",
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
