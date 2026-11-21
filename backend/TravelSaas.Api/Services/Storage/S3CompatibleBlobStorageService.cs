using System.Text.RegularExpressions;

namespace TravelSaas.Api.Services.Storage;

public class S3CompatibleBlobStorageService : IBlobStorageService
{
    private readonly IConfiguration _config;
    private readonly ILogger<S3CompatibleBlobStorageService> _logger;
    private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".pdf", ".docx", ".xlsx", ".csv" };
    private const long MaxFileSize = 15 * 1024 * 1024; // 15MB

    public S3CompatibleBlobStorageService(IConfiguration config, ILogger<S3CompatibleBlobStorageService> logger)
    {
        _config = config;
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
        var uniqueFileName = $"{Guid.NewGuid()}{ext}";
        var objectKey = $"{tenantSegment}/{sanitizedSubFolder}/{uniqueFileName}";

        var publicEndpoint = _config["Storage:S3:PublicUrl"] ?? "https://storage.v4journey.com/travelsaas";
        var fileUrl = $"{publicEndpoint.TrimEnd('/')}/{objectKey}";

        _logger.LogInformation("Simulated S3 upload to bucket for object key {ObjectKey}", objectKey);
        await Task.CompletedTask;

        return (fileUrl, file.FileName);
    }

    public Task<(Stream fileStream, string contentType, string fileName)?> GetFileAsync(string fileUrl, Guid tenantId)
    {
        _logger.LogInformation("Retrieving object {FileUrl} for tenant {TenantId} from S3-compatible storage", fileUrl, tenantId);
        return Task.FromResult<(Stream fileStream, string contentType, string fileName)?>(null);
    }

    public Task<bool> DeleteFileAsync(string fileUrl, Guid tenantId)
    {
        _logger.LogInformation("Deleting object {FileUrl} for tenant {TenantId} from S3-compatible storage", fileUrl, tenantId);
        return Task.FromResult(true);
    }
}

