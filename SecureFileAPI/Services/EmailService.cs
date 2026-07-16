using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;

namespace SecureFileAPI.Services;

/// <summary>
/// Service to send real emails via SMTP using Gmail.
/// </summary>
public class EmailService
{
    private readonly ILogger<EmailService> _logger;
    private const string SmtpServer = "smtp.gmail.com";
    private const int SmtpPort = 587;
    private const string FromAddress = "projectmailm@gmail.com";
    private const string AppPassword = "tdyr kebi hnyr yzyh"; // Gmail App Password

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Sends an email asynchronously.
    /// </summary>
    /// <param name="toEmail">Recipient's email address</param>
    /// <param name="subject">Email subject</param>
    /// <param name="body">Email body content</param>
    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        if (string.IsNullOrWhiteSpace(toEmail))
        {
            _logger.LogWarning("Email recipient address is null or empty. Email subject: {Subject}", subject);
            return;
        }

        try
        {
            _logger.LogInformation("Attempting to send email to {ToEmail} with subject: {Subject}", toEmail, subject);

            using var client = new SmtpClient(SmtpServer, SmtpPort)
            {
                Credentials = new NetworkCredential(FromAddress, AppPassword),
                EnableSsl = true
            };

            using var mailMessage = new MailMessage
            {
                From = new MailAddress(FromAddress, "PASSPCloud Security"),
                Subject = subject,
                Body = body,
                IsBodyHtml = false
            };

            mailMessage.To.Add(toEmail);

            await client.SendMailAsync(mailMessage);
            _logger.LogInformation("Email sent successfully to {ToEmail}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {ToEmail} via SMTP.", toEmail);
        }
    }
}
