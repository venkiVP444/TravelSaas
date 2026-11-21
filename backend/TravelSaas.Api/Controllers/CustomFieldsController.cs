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
    public async Task<ActionResult<List<CustomFieldDto>>> GetFields([FromQuery] string? entity)
    {
        var query = _context.CustomFieldDefinitions.AsQueryable();
        if (!string.IsNullOrWhiteSpace(entity))
        {
            query = query.Where(f => f.TargetEntity.ToLower() == entity.ToLower());
        }

        var list = await query
            .Select(f => new CustomFieldDto(
                f.Id,
                f.TargetEntity,
                f.FieldKey,
                f.FieldLabel,
                f.FieldType,
                f.IsRequired,
                f.ShowInTable,
                f.OptionsJson
            ))
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<CustomFieldDto>> CreateField([FromBody] CreateCustomFieldRequest request)
    {
        var tenantId = _tenantService.GetCurrentTenantId();

        var def = new CustomFieldDefinition
        {
            TenantId = tenantId,
            TargetEntity = request.TargetEntity,
            FieldKey = request.FieldKey.Trim(),
            FieldLabel = request.FieldLabel.Trim(),
            FieldType = request.FieldType ?? "text",
            IsRequired = request.IsRequired,
            ShowInTable = request.ShowInTable,
            OptionsJson = request.OptionsJson
        };

        _context.CustomFieldDefinitions.Add(def);
        await _context.SaveChangesAsync();

        return Ok(new CustomFieldDto(
            def.Id,
            def.TargetEntity,
            def.FieldKey,
            def.FieldLabel,
            def.FieldType,
            def.IsRequired,
            def.ShowInTable,
            def.OptionsJson
        ));
    }
}

