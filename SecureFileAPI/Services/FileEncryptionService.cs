using System.Security.Cryptography;

namespace SecureFileAPI.Services;

/// <summary>
/// Provides AES-256-CBC encryption and decryption for files stored on disk.
/// Demonstrates encryption-at-rest as a key security mitigation.
/// </summary>
public class FileEncryptionService
{
    private readonly byte[] _key;

    public FileEncryptionService(IConfiguration config)
    {
        var keyBase64 = config["EncryptionSettings:AesKeyBase64"]!;
        _key = Convert.FromBase64String(keyBase64);

        if (_key.Length != 32)
            throw new InvalidOperationException("AES key must be exactly 256 bits (32 bytes).");
    }

    /// <summary>
    /// Encrypts a stream and writes to destination. Returns the Base64-encoded IV.
    /// </summary>
    public async Task<string> EncryptAsync(Stream sourceStream, Stream destinationStream)
    {
        using var aes = Aes.Create();
        aes.Key = _key;
        aes.GenerateIV(); // Unique IV per file
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        // Write IV at the start of the encrypted file
        await destinationStream.WriteAsync(aes.IV);

        using var encryptor = aes.CreateEncryptor();
        using var cryptoStream = new CryptoStream(destinationStream, encryptor, CryptoStreamMode.Write, leaveOpen: true);
        await sourceStream.CopyToAsync(cryptoStream);
        await cryptoStream.FlushFinalBlockAsync();

        return Convert.ToBase64String(aes.IV);
    }

    /// <summary>
    /// Decrypts a file stream back to the original bytes.
    /// </summary>
    public async Task DecryptAsync(Stream encryptedStream, Stream destinationStream)
    {
        // Read the IV from the first 16 bytes
        var iv = new byte[16];
        var bytesRead = await encryptedStream.ReadAsync(iv, 0, 16);
        if (bytesRead < 16)
            throw new InvalidDataException("Encrypted file is corrupt: IV is missing.");

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = iv;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var decryptor = aes.CreateDecryptor();
        using var cryptoStream = new CryptoStream(encryptedStream, decryptor, CryptoStreamMode.Read, leaveOpen: true);
        await cryptoStream.CopyToAsync(destinationStream);
    }
}
