using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelSaas.Api.Data;
using TravelSaas.Api.Domain.Entities;
using TravelSaas.Api.Domain.Enums;
using TravelSaas.Api.DTOs;
using TravelSaas.Api.Services;

namespace TravelSaas.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ResourcesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;

    public ResourcesController(AppDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    [HttpGet("types")]
    public async Task<ActionResult<List<ResourceTypeDto>>> GetResourceTypes()
    {
        var types = await _context.ResourceTypes
            .Include(t => t.FieldDefinitions.OrderBy(f => f.DisplayOrder))
            .OrderBy(t => t.DisplayOrder)
            .Select(t => new ResourceTypeDto(
                t.Id,
                t.Key,
                t.DisplayName,
                t.Icon,
                t.DisplayOrder,
                t.IsSystem,
                t.FieldDefinitions.Select(f => new ResourceFieldDto(
                    f.Id,
                    f.FieldKey,
                    f.Label,
                    f.DataType,
                    f.IsRequired,
                    f.ShowInTable,
                    f.OptionsJson,
                    f.DisplayOrder
                )).ToList()
            ))
            .ToListAsync();

        return Ok(types);
    }

    [HttpPost("types")]
    public async Task<ActionResult<ResourceTypeDto>> CreateResourceType([FromBody] CreateResourceTypeRequest request)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var type = new ResourceType
        {
            TenantId = tenantId,
            Key = request.Key.ToLower().Trim(),
            DisplayName = request.DisplayName,
            Icon = request.Icon ?? "box",
            IsSystem = false
        };

        if (request.Fields != null)
        {
            foreach (var f in request.Fields)
            {
                type.FieldDefinitions.Add(new ResourceFieldDefinition
                {
                    TenantId = tenantId,
                    FieldKey = f.FieldKey,
                    Label = f.Label,
                    DataType = f.DataType,
                    IsRequired = f.IsRequired,
                    ShowInTable = f.ShowInTable,
                    OptionsJson = f.OptionsJson,
                    DisplayOrder = f.DisplayOrder
                });
            }
        }

        _context.ResourceTypes.Add(type);
        await _context.SaveChangesAsync();

        return Ok(type);
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<ResourceDto>>> GetResources(
        [FromQuery] string? typeKey,
        [FromQuery] string? search,
        [FromQuery] string? ownership,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        var query = _context.Resources.Include(r => r.ResourceType).AsQueryable();

        if (!string.IsNullOrWhiteSpace(typeKey) && typeKey.ToLower() != "all")
        {
            query = query.Where(r => r.ResourceType != null && r.ResourceType.Key.ToLower() == typeKey.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(ownership) && ownership.ToLower() != "all")
        {
            if (Enum.TryParse<OwnershipType>(ownership, true, out var parsedOwnership))
            {
                query = query.Where(r => r.Ownership == parsedOwnership);
            }
        }

        if (!string.IsNullOrWhiteSpace(status) && status.ToLower() != "all")
        {
            if (Enum.TryParse<ResourceStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(r => r.Status == parsedStatus);
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(r => r.Name.ToLower().Contains(s) ||
                                     r.Code.ToLower().Contains(s) ||
                                     (r.IdentificationNo != null && r.IdentificationNo.ToLower().Contains(s)) ||
                                     (r.PartnerName != null && r.PartnerName.ToLower().Contains(s)));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ResourceDto(
                r.Id,
                r.ResourceTypeId,
                r.ResourceType != null ? r.ResourceType.Key : "",
                r.ResourceType != null ? r.ResourceType.DisplayName : "",
                r.Code,
                r.Name,
                r.IdentificationNo,
                r.Ownership.ToString(),
                r.PartnerName,
                r.ContactNo,
                r.Address,
                r.Status.ToString(),
                r.PictureUrl,
                r.InsurancePeriod,
                r.CurrentTripName,
                r.CustomValuesJson,
                r.CreatedAt
            ))
            .ToListAsync();

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        return Ok(new PagedResult<ResourceDto>(items, totalCount, page, pageSize, totalPages));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ResourceDto>> GetResourceById(Guid id)
    {
        var r = await _context.Resources.Include(res => res.ResourceType).FirstOrDefaultAsync(res => res.Id == id);
        if (r == null)
        {
            return NotFound(new { message = "Resource not found." });
        }

        return Ok(new ResourceDto(
            r.Id,
            r.ResourceTypeId,
            r.ResourceType?.Key ?? "",
            r.ResourceType?.DisplayName ?? "",
            r.Code,
            r.Name,
            r.IdentificationNo,
            r.Ownership.ToString(),
            r.PartnerName,
            r.ContactNo,
            r.Address,
            r.Status.ToString(),
            r.PictureUrl,
            r.InsurancePeriod,
            r.CurrentTripName,
            r.CustomValuesJson,
            r.CreatedAt
        ));
    }

    [HttpPost]
    public async Task<ActionResult<ResourceDto>> CreateResource([FromBody] CreateResourceRequest request)
    {
        var tenantId = _tenantService.GetCurrentTenantId();

        var code = request.Code;
        if (string.IsNullOrWhiteSpace(code))
        {
            var count = await _context.Resources.CountAsync() + 1;
            code = $"#{count:D4}";
        }

        Enum.TryParse<OwnershipType>(request.Ownership, true, out var ownership);
        Enum.TryParse<ResourceStatus>(request.Status, true, out var status);

        var resource = new Resource
        {
            TenantId = tenantId,
            ResourceTypeId = request.ResourceTypeId,
            Code = code,
            Name = request.Name,
            IdentificationNo = request.IdentificationNo,
            Ownership = ownership,
            PartnerName = request.PartnerName,
            ContactNo = request.ContactNo,
            Address = request.Address,
            Status = status,
            InsurancePeriod = request.InsurancePeriod,
            CustomValuesJson = request.CustomValuesJson ?? "{}"
        };

        _context.Resources.Add(resource);

        _context.ActivityLogs.Add(new ActivityLog
        {
            TenantId = tenantId,
            UserName = "Current User",
            Action = "Create",
            EntityType = "Resource",
            EntityId = resource.Id,
            Description = $"Created resource {resource.Name} ({resource.Code})",
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        var detailRes = await GetResourceById(resource.Id);
        var detail = (detailRes.Result as OkObjectResult)?.Value ?? detailRes.Value;
        return CreatedAtAction(nameof(GetResourceById), new { id = resource.Id }, detail);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateResource(Guid id, [FromBody] CreateResourceRequest request)
    {
        var resource = await _context.Resources.FirstOrDefaultAsync(r => r.Id == id);
        if (resource == null)
        {
            return NotFound(new { message = "Resource not found." });
        }

        Enum.TryParse<OwnershipType>(request.Ownership, true, out var ownership);
        Enum.TryParse<ResourceStatus>(request.Status, true, out var status);

        resource.Name = request.Name;
        resource.IdentificationNo = request.IdentificationNo;
        resource.Ownership = ownership;
        resource.PartnerName = request.PartnerName;
        resource.ContactNo = request.ContactNo;
        resource.Address = request.Address;
        resource.Status = status;
        resource.InsurancePeriod = request.InsurancePeriod;
        if (!string.IsNullOrWhiteSpace(request.CustomValuesJson))
        {
            resource.CustomValuesJson = request.CustomValuesJson;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Resource updated successfully." });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteResource(Guid id)
    {
        var resource = await _context.Resources.FirstOrDefaultAsync(r => r.Id == id);
        if (resource == null)
        {
            return NotFound(new { message = "Resource not found." });
        }

        _context.Resources.Remove(resource);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Resource deleted successfully." });
    }
}
