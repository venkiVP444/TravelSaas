using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelSaas.Api.Data;
using TravelSaas.Api.DTOs;

namespace TravelSaas.Api.Controllers;

[AllowAnonymous]
[ApiController]
[Route("api/public/trips")]
public class PublicTripsController : ControllerBase
{
    private readonly AppDbContext _context;

    public PublicTripsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<PublicTripDto>> GetPublicTrip(string slug)
    {
        // Public queries bypass tenant filter to find trip by unique slug across published trips
        var trip = await _context.Trips.IgnoreQueryFilters()
            .Include(t => t.Schedules)
            .FirstOrDefaultAsync(t => t.PublicSlug == slug && t.IsPublished);

        if (trip == null)
        {
            return NotFound(new { message = "This trip is currently not publicly available or has been unpublished." });
        }

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == trip.TenantId);

        var publicItinerary = trip.Schedules
            .OrderBy(s => s.DayNumber)
            .ThenBy(s => s.TimeString)
            .Select(s => new PublicTripScheduleDto(s.DayNumber, s.DayDate, s.TimeString, s.Activity, s.Location))
            .ToList();

        var availableSeats = Math.Max(0, trip.TotalSeats - trip.BookedSeats);

        // Security: NEVER return internal financial margins, expenses, profit, internal team members, or private customer records!
        var publicDto = new PublicTripDto(
            trip.TripCode,
            trip.Name,
            trip.Description,
            trip.ThumbnailUrl,
            trip.Category,
            trip.Origin,
            trip.Destination,
            trip.Via,
            trip.StartDateTime,
            trip.EndDateTime,
            trip.Duration,
            trip.TotalSeats,
            availableSeats,
            trip.FoodInfo,
            trip.PickupDrop,
            trip.AdultPrice,
            trip.ChildPrice,
            tenant?.Name ?? "V4Journey",
            tenant?.LogoUrl,
            publicItinerary
        );

        return Ok(publicDto);
    }
}

