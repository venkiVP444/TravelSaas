using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelSaas.Api.Data;
using TravelSaas.Api.Domain.Entities;
using TravelSaas.Api.DTOs;
using TravelSaas.Api.Services;

namespace TravelSaas.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/custom-fields")]
public class CustomFieldsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;

    public CustomFieldsController(AppDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    [HttpGet]
    public async Task<ActionResult<List<CustomFieldDto>>> GetFields(
        [FromQuery] string? entity,
        [FromQuery] string? module,
        [FromQuery] bool includeArchived = false)
    {
        var target = !string.IsNullOrWhiteSpace(module) ? module : entity;
        var query = _context.CustomFieldDefinitions.AsQueryable();

        if (!string.IsNullOrWhiteSpace(target))
        {
            query = query.Where(f => f.TargetEntity.ToLower() == target.ToLower());
        }

        if (!includeArchived)
        {
            query = query.Where(f => !f.IsArchived);
        }

        var list = await query
            .OrderBy(f => f.SortOrder)
            .ThenBy(f => f.CreatedAt)
            .Select(f => new CustomFieldDto(
                f.Id,
                f.TargetEntity,
                f.FieldKey,
                f.FieldLabel,
                f.FieldType,
                f.IsRequired,
                f.ShowInTable,
                f.OptionsJson,
                f.DefaultValue,
                f.SortOrder,
                f.IsArchived,
                f.ValidationRulesJson
            ))
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<CustomFieldDto>> CreateField([FromBody] CreateCustomFieldRequest request)
    {
        var label = !string.IsNullOrWhiteSpace(request.FieldLabel) ? request.FieldLabel.Trim() : request.Label?.Trim();
        if (string.IsNullOrWhiteSpace(label))
        {
            return BadRequest(new { message = "Field Label is required." });
        }

        var tenantId = _tenantService.GetCurrentTenantId();
        var targetEntity = string.IsNullOrWhiteSpace(request.TargetEntity) ? "Trip" : request.TargetEntity.Trim();
        var fieldKey = string.IsNullOrWhiteSpace(request.FieldKey)
            ? label.ToLower().Replace(" ", "_").Replace("-", "_")
            : request.FieldKey.Trim();

        var fieldType = !string.IsNullOrWhiteSpace(request.FieldType)
            ? request.FieldType.Trim()
            : (!string.IsNullOrWhiteSpace(request.DataType) ? request.DataType.Trim() : "text");

        // Enforce unique key per tenant and target module, reactivating if previously archived
        var existing = await _context.CustomFieldDefinitions
            .FirstOrDefaultAsync(f => f.TenantId == tenantId && f.TargetEntity.ToLower() == targetEntity.ToLower() && f.FieldKey.ToLower() == fieldKey.ToLower());

        if (existing != null)
        {
            if (existing.IsArchived)
            {
                existing.FieldLabel = label;
                existing.FieldType = fieldType;
                existing.IsRequired = request.IsRequired;
                existing.ShowInTable = request.ShowInTable;
                existing.OptionsJson = request.OptionsJson;
                existing.DefaultValue = request.DefaultValue;
                existing.IsArchived = false;
                existing.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new CustomFieldDto(
                    existing.Id,
                    existing.TargetEntity,
                    existing.FieldKey,
                    existing.FieldLabel,
                    existing.FieldType,
                    existing.IsRequired,
                    existing.ShowInTable,
                    existing.OptionsJson,
                    existing.DefaultValue,
                    existing.SortOrder,
                    existing.IsArchived,
                    existing.ValidationRulesJson
                ));
            }
            return Conflict(new { message = $"A custom field with key '{fieldKey}' already exists in module '{targetEntity}'." });
        }

        var maxSort = await _context.CustomFieldDefinitions
            .Where(f => f.TenantId == tenantId && f.TargetEntity.ToLower() == targetEntity.ToLower())
            .Select(f => (int?)f.SortOrder)
            .MaxAsync() ?? 0;

        var def = new CustomFieldDefinition
        {
            TenantId = tenantId,
            TargetEntity = targetEntity,
            FieldKey = fieldKey,
            FieldLabel = label,
            FieldType = fieldType,
            IsRequired = request.IsRequired,
            ShowInTable = request.ShowInTable,
            OptionsJson = request.OptionsJson,
            DefaultValue = request.DefaultValue,
            SortOrder = request.SortOrder ?? (maxSort + 1),
            IsArchived = false,
            ValidationRulesJson = request.ValidationRulesJson,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.CustomFieldDefinitions.Add(def);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetFields), new { entity = def.TargetEntity }, new CustomFieldDto(
            def.Id,
            def.TargetEntity,
            def.FieldKey,
            def.FieldLabel,
            def.FieldType,
            def.IsRequired,
            def.ShowInTable,
            def.OptionsJson,
            def.DefaultValue,
            def.SortOrder,
            def.IsArchived,
            def.ValidationRulesJson
        ));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CustomFieldDto>> UpdateField(Guid id, [FromBody] UpdateCustomFieldRequest request)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var def = await _context.CustomFieldDefinitions.FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId);
        if (def == null)
        {
            return NotFound(new { message = "Custom field not found." });
        }

        if (!string.IsNullOrWhiteSpace(request.FieldLabel))
        {
            def.FieldLabel = request.FieldLabel.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.FieldType))
        {
            def.FieldType = request.FieldType;
        }

        def.IsRequired = request.IsRequired;
        def.ShowInTable = request.ShowInTable;

        if (request.OptionsJson != null)
        {
            def.OptionsJson = request.OptionsJson;
        }

        if (request.DefaultValue != null)
        {
            def.DefaultValue = request.DefaultValue;
        }

        if (request.SortOrder.HasValue)
        {
            def.SortOrder = request.SortOrder.Value;
        }

        if (request.IsArchived.HasValue)
        {
            def.IsArchived = request.IsArchived.Value;
        }

        if (request.ValidationRulesJson != null)
        {
            def.ValidationRulesJson = request.ValidationRulesJson;
        }

        def.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new CustomFieldDto(
            def.Id,
            def.TargetEntity,
            def.FieldKey,
            def.FieldLabel,
            def.FieldType,
            def.IsRequired,
            def.ShowInTable,
            def.OptionsJson,
            def.DefaultValue,
            def.SortOrder,
            def.IsArchived,
            def.ValidationRulesJson
        ));
    }

    [HttpPut("{id}/archive")]
    public async Task<ActionResult> ArchiveField(Guid id, [FromQuery] bool archive = true)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var def = await _context.CustomFieldDefinitions.FirstOrDefaultAsync(f => f.Id == id && f.TenantId == tenantId);
        if (def == null)
        {
            return NotFound(new { message = "Custom field not found." });
        }

        def.IsArchived = archive;
        def.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new {
            id = def.Id,
            isArchived = def.IsArchived,
            message = archive ? "Field archived. Historical customer values are safely preserved." : "Field restored."
        });
    }

    [HttpPost("reorder")]
    public async Task<ActionResult> ReorderFields([FromBody] ReorderCustomFieldsRequest request)
    {
        if (request.FieldIds == null || !request.FieldIds.Any())
        {
            return BadRequest(new { message = "Field IDs list is required." });
        }

        var tenantId = _tenantService.GetCurrentTenantId();
        var fields = await _context.CustomFieldDefinitions
            .Where(f => f.TenantId == tenantId && request.FieldIds.Contains(f.Id))
            .ToListAsync();

        for (int i = 0; i < request.FieldIds.Count; i++)
        {
            var f = fields.FirstOrDefault(item => item.Id == request.FieldIds[i]);
            if (f != null)
            {
                f.SortOrder = i + 1;
                f.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Field order updated successfully." });
    }
}
