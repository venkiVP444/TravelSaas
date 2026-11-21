namespace TravelSaas.Api.Services.Storage;

public interface IBlobStorageService
{
    Task<(string fileUrl, string fileName)> SaveFileAsync(IFormFile file, string subFolder, Guid? tenantId = null);
    Task<(Stream fileStream, string contentType, string fileName)?> GetFileAsync(string fileUrl, Guid tenantId);
    Task<bool> DeleteFileAsync(string fileUrl, Guid tenantId);
}

