using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SecureFileAPI.Data;
using SecureFileAPI.Models;
using SecureFileAPI.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Railway provides PORT env var — bind to it
var port = Environment.GetEnvironmentVariable("PORT") ?? "5165";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "SecureFileAPI", Version = "v1", Description = "College Project: File Sharing Security Risks Demo" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter JWT with Bearer into field",
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement {
    {
        new OpenApiSecurityScheme
        {
            Reference = new OpenApiReference
            {
                Type = ReferenceType.SecurityScheme,
                Id = "Bearer"
            }
        },
        Array.Empty<string>()
    }});
});

// Configure Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]!;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

// Register Custom Services
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<FileEncryptionService>();
builder.Services.AddScoped<AuditService>();
builder.Services.AddScoped<EmailService>();

// CORS — allow any origin (required for Vercel frontend in production)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Ensure seeded users are present and have correct hashes at startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    // 1. Admin user
    var admin = db.Users.FirstOrDefault(u => u.Username == "admin");
    if (admin != null)
    {
        admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123");
    }

    // 2. Also support "server" / "server" (matching Python reference app)
    var server = db.Users.FirstOrDefault(u => u.Username == "server");
    if (server == null)
    {
        server = new User
        {
            Username = "server",
            Email = "server@securefile.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("server"),
            Role = "Admin",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(server);
    }
    else
    {
        server.PasswordHash = BCrypt.Net.BCrypt.HashPassword("server");
    }

    // 3. Ensure mark has the correct password "mark"
    var mark = db.Users.FirstOrDefault(u => u.Username == "mark");
    if (mark != null)
    {
        mark.PasswordHash = BCrypt.Net.BCrypt.HashPassword("mark");
    }

    // 4. Ensure Kumar has the correct password "Kumar"
    var kumar = db.Users.FirstOrDefault(u => u.Username == "Kumar");
    if (kumar != null)
    {
        kumar.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Kumar");
    }

    db.SaveChanges();
}

// Configure the HTTP request pipeline.
app.UseSwagger();
app.UseSwaggerUI();

// app.UseHttpsRedirection();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

