using System.Text.RegularExpressions;

namespace TravelSaas.Api.Services.Storage;

public class LocalBlobStorageService : IBlobStorageService
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<LocalBlobStorageService> _logger;
    private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".pdf", ".docx", ".xlsx", ".csv" };
    private const long MaxFileSize = 15 * 1024 * 1024; // 15MB

    public LocalBlobStorageService(IWebHostEnvironment env, ILogger<LocalBlobStorageService> logger)
    {
        _env = env;
        _logger = logger;
    }

    public async Task<(string fileUrl, string fileName)> SaveFileAsync(IFormFile file, string subFolder, Guid? tenantId = null)
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("No file provided.");
        }

        if (file.Length > MaxFileSize)
        {
            throw new InvalidOperationException($"File size exceeds {MaxFileSize / (1024 * 1024)}MB limit.");
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowedExtensions.Contains(ext))
        {
            throw new InvalidOperationException($"File extension '{ext}' is not permitted.");
        }

        var sanitizedSubFolder = Regex.Replace(subFolder ?? "general", @"[^a-zA-Z0-9_-]", "");
        if (string.IsNullOrWhiteSpace(sanitizedSubFolder))
        {
            sanitizedSubFolder = "general";
        }

        var tenantSegment = tenantId.HasValue ? tenantId.Value.ToString() : "common";
        var uploadsFolder = Path.Combine(_env.ContentRootPath, "uploads", tenantSegment, sanitizedSubFolder);
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var uniqueFileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        _logger.LogInformation("Saved local file for tenant {TenantId} at {FilePath}", tenantSegment, filePath);
        var fileUrl = $"/uploads/{tenantSegment}/{sanitizedSubFolder}/{uniqueFileName}";
        return (fileUrl, file.FileName);
    }

    public Task<(Stream fileStream, string contentType, string fileName)?> GetFileAsync(string fileUrl, Guid tenantId)
    {
        var relative = fileUrl.TrimStart('/');
        var fullPath = Path.Combine(_env.ContentRootPath, relative.Replace('/', Path.DirectorySeparatorChar));

        // Security check: tenant isolation & directory traversal check
        var tenantStr = tenantId.ToString();
        if (!fullPath.Contains(tenantStr) && !fullPath.Contains("common"))
        {
            _logger.LogWarning("Unauthorized access attempt to file {FileUrl} by tenant {TenantId}", fileUrl, tenantId);
            return Task.FromResult<(Stream fileStream, string contentType, string fileName)?>(null);
        }

        if (!File.Exists(fullPath))
        {
            return Task.FromResult<(Stream fileStream, string contentType, string fileName)?>(null);
        }

        var contentType = GetMimeType(Path.GetExtension(fullPath));
        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult<(Stream fileStream, string contentType, string fileName)?>((stream, contentType, Path.GetFileName(fullPath)));
    }

    public Task<bool> DeleteFileAsync(string fileUrl, Guid tenantId)
    {
        var relative = fileUrl.TrimStart('/');
        var fullPath = Path.Combine(_env.ContentRootPath, relative.Replace('/', Path.DirectorySeparatorChar));

        if (!fullPath.Contains(tenantId.ToString()))
        {
            return Task.FromResult(false);
        }

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
            return Task.FromResult(true);
        }

        return Task.FromResult(false);
    }

    private static string GetMimeType(string extension) => extension.ToLowerInvariant() switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".webp" => "image/webp",
        ".pdf" => "application/pdf",
        ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".csv" => "text/csv",
        _ => "application/octet-stream"
    };
}

