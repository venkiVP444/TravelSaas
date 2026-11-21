using TravelSaas.Api.Services.Storage;

namespace TravelSaas.Api.Services;

public interface IFileStorageService
{
    Task<(string fileUrl, string fileName)> SaveFileAsync(IFormFile file, string subFolder, Guid? tenantId = null);
    Task<(Stream fileStream, string contentType, string fileName)?> GetFileAsync(string fileUrl, Guid tenantId);
    Task<bool> DeleteFileAsync(string fileUrl, Guid tenantId);
}

public class LocalFileStorageService : IFileStorageService
{
    private readonly IBlobStorageService _blobStorage;

    public LocalFileStorageService(IBlobStorageService blobStorage)
    {
        _blobStorage = blobStorage;
    }

    public Task<(string fileUrl, string fileName)> SaveFileAsync(IFormFile file, string subFolder, Guid? tenantId = null)
    {
        return _blobStorage.SaveFileAsync(file, subFolder, tenantId);
    }

    public Task<(Stream fileStream, string contentType, string fileName)?> GetFileAsync(string fileUrl, Guid tenantId)
    {
        return _blobStorage.GetFileAsync(fileUrl, tenantId);
    }

    public Task<bool> DeleteFileAsync(string fileUrl, Guid tenantId)
    {
        return _blobStorage.DeleteFileAsync(fileUrl, tenantId);
    }
}
