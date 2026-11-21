using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelSaas.Api.Data;
using TravelSaas.Api.Domain.Enums;
using TravelSaas.Api.DTOs;

namespace TravelSaas.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        var totalTrips = await _context.Trips.CountAsync(t => t.Status != TripStatus.Archived);
        var upcomingTrips = await _context.Trips.CountAsync(t => t.Status == TripStatus.Upcoming || t.StartDateTime >= DateTime.UtcNow);
        
        // Sum revenue from adult and child bookings
        var totalRevenue = await _context.Trips
            .Where(t => t.Status != TripStatus.Archived && t.Status != TripStatus.Canceled)
            .SumAsync(t => (t.BookedSeats * t.AdultPrice));

        var totalTravellers = await _context.Trips
            .Where(t => t.Status != TripStatus.Archived)
            .SumAsync(t => t.BookedSeats);

        var activeResources = await _context.Resources.CountAsync(r => r.Status == ResourceStatus.InTrip || r.Status == ResourceStatus.Available);
        var totalTeamMembers = await _context.Members.CountAsync();

        var recentLogs = await _context.ActivityLogs
            .OrderByDescending(l => l.Timestamp)
            .Take(10)
            .Select(l => new RecentActivityDto(l.Id, l.UserName, l.Action, l.EntityType, l.Description, l.Timestamp))
            .ToListAsync();

        return Ok(new DashboardStatsDto(
            totalTrips,
            upcomingTrips,
            totalRevenue,
            totalTravellers,
            activeResources,
            totalTeamMembers,
            recentLogs
        ));
    }
}

