using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelSaas.Api.Services;

namespace TravelSaas.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UploadsController : ControllerBase
{
    private readonly IFileStorageService _fileStorage;
    private readonly ITenantService _tenantService;

    public UploadsController(IFileStorageService fileStorage, ITenantService tenantService)
    {
        _fileStorage = fileStorage;
        _tenantService = tenantService;
    }

    [HttpPost]
    [RequestSizeLimit(15 * 1024 * 1024)]
    public async Task<ActionResult> Upload([FromForm] IFormFile file, [FromQuery] string folder = "general")
    {
        try
        {
            var tenantId = _tenantService.GetCurrentTenantId();
            var (url, name) = await _fileStorage.SaveFileAsync(file, folder, tenantId);
            return Ok(new { fileUrl = url, fileName = name });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{tenantId:guid}/{folder}/{fileName}")]
    public async Task<IActionResult> Download(Guid tenantId, string folder, string fileName)
    {
        var currentTenantId = _tenantService.GetCurrentTenantId();
        if (tenantId != currentTenantId && !User.IsInRole("SuperAdmin"))
        {
            return Forbid();
        }

        var fileUrl = $"/uploads/{tenantId}/{folder}/{fileName}";
        var fileData = await _fileStorage.GetFileAsync(fileUrl, currentTenantId);
        if (fileData == null)
        {
            return NotFound(new { message = "File not found or access denied." });
        }

        return File(fileData.Value.fileStream, fileData.Value.contentType, fileData.Value.fileName);
    }
}

