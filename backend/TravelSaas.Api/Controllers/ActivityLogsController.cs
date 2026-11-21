using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelSaas.Api.Data;
using TravelSaas.Api.Domain.Entities;

namespace TravelSaas.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/activity-logs")]
public class ActivityLogsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ActivityLogsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<ActivityLog>>> GetLogs([FromQuery] string? entityType, [FromQuery] Guid? entityId)
    {
        var query = _context.ActivityLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(entityType))
        {
            query = query.Where(l => l.EntityType.ToLower() == entityType.ToLower());
        }

        if (entityId.HasValue)
        {
            query = query.Where(l => l.EntityId == entityId.Value);
        }

        var list = await query
            .OrderByDescending(l => l.Timestamp)
            .Take(50)
            .ToListAsync();

        return Ok(list);
    }
}

