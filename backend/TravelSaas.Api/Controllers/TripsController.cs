using System.Text;
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
public class TripsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;

    public TripsController(AppDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<TripListDto>>> GetTrips(
        [FromQuery] string? status,
        [FromQuery] string? tripId,
        [FromQuery] string? tripName,
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string sortBy = "CreatedAt",
        [FromQuery] bool sortDesc = true)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var tenantId = _tenantService.GetCurrentTenantId();
        var query = _context.Trips.Where(t => t.TenantId == tenantId);

        // Status filter
        if (!string.IsNullOrWhiteSpace(status) && status.ToLower() != "all")
        {
            if (Enum.TryParse<TripStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(t => t.Status == parsedStatus);
            }
        }

        // Trip ID filter
        if (!string.IsNullOrWhiteSpace(tripId))
        {
            query = query.Where(t => t.TripCode.ToLower().Contains(tripId.ToLower()));
        }

        // Trip Name filter
        if (!string.IsNullOrWhiteSpace(tripName))
        {
            query = query.Where(t => t.Name.ToLower().Contains(tripName.ToLower()));
        }

        // Category filter
        if (!string.IsNullOrWhiteSpace(category) && category.ToLower() != "all")
        {
            query = query.Where(t => t.Category.ToLower() == category.ToLower());
        }

        // Search
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(t => t.Name.ToLower().Contains(s) ||
                                     t.TripCode.ToLower().Contains(s) ||
                                     t.Origin.ToLower().Contains(s) ||
                                     t.Destination.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync();

        // Sorting
        query = (sortBy.ToLower(), sortDesc) switch
        {
            ("name", false) => query.OrderBy(t => t.Name),
            ("name", true) => query.OrderByDescending(t => t.Name),
            ("tripcode", false) => query.OrderBy(t => t.TripCode),
            ("tripcode", true) => query.OrderByDescending(t => t.TripCode),
            ("startdatetime", false) => query.OrderBy(t => t.StartDateTime),
            ("startdatetime", true) => query.OrderByDescending(t => t.StartDateTime),
            _ => sortDesc ? query.OrderByDescending(t => t.CreatedAt) : query.OrderBy(t => t.CreatedAt)
        };

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TripListDto(
                t.Id,
                t.TripCode,
                t.Name,
                t.Category,
                $"{t.Origin} - {t.Destination}",
                $"{t.StartDateTime:dd MMM yyyy} - {t.EndDateTime:dd MMM yyyy}",
                t.Duration,
                t.StartDateTime.AddDays(-1).ToString("dd MMM yyyy"),
                t.Status.ToString(),
                t.TotalSeats,
                Math.Max(0, t.TotalSeats - t.BookedSeats),
                t.BookedSeats,
                t.AdultPrice,
                t.ChildPrice,
                t.IsPublished,
                t.PublicSlug
            ))
            .ToListAsync();

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        return Ok(new PagedResult<TripListDto>(items, totalCount, page, pageSize, totalPages));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TripDetailDto>> GetTripById(Guid id)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var trip = await _context.Trips
            .Include(t => t.Schedules)
            .Include(t => t.Travellers)
            .Include(t => t.TeamAssignments)
                .ThenInclude(ta => ta.Member)
            .Include(t => t.ResourceAssignments)
                .ThenInclude(ra => ra.Resource)
                    .ThenInclude(r => r!.ResourceType)
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);

        if (trip == null)
        {
            return NotFound(new { message = "Trip not found." });
        }

        var availableSeats = Math.Max(0, trip.TotalSeats - trip.BookedSeats);
        var totalIncome = trip.BookedSeats * trip.AdultPrice;
        var totalExpenses = trip.BookedSeats * trip.AdultSpends;
        var totalProfit = totalIncome - totalExpenses;

        var scheduleDtos = trip.Schedules
            .OrderBy(s => s.DayNumber)
            .ThenBy(s => s.TimeString)
            .Select(s => new TripScheduleDto(s.Id, s.DayNumber, s.DayDate, s.TimeString, s.Activity, s.Location))
            .ToList();

        var travellerDtos = trip.Travellers
            .Select(tr => new TripTravellerDto(
                tr.Id,
                tr.TravellerName,
                tr.AgeGender,
                tr.Contact,
                tr.Type,
                tr.PickupLocation,
                tr.DropLocation,
                tr.PaymentStatus.ToString(),
                tr.PaidAmount,
                tr.BalanceAmount,
                tr.FoodInfo
            ))
            .ToList();

        var teamDtos = trip.TeamAssignments
            .Where(ta => ta.Member != null)
            .Select(ta => new TripTeamMemberDto(
                ta.Id,
                ta.MemberId,
                ta.Member!.MemberCode,
                ta.Member.FullName,
                ta.Member.MobileNo,
                ta.AssignedRole,
                $"{ta.Member.Age} / {ta.Member.Gender}",
                ta.Member.LicenseNo,
                ta.Member.WorkType,
                ta.Member.FoodInfo
            ))
            .ToList();

        var resourceDtos = trip.ResourceAssignments
            .Where(ra => ra.Resource != null)
            .Select(ra => new TripResourceDto(
                ra.Id,
                ra.ResourceId,
                ra.Resource!.Code,
                ra.Resource.Name,
                ra.Resource.ResourceType?.DisplayName ?? "Resource",
                ra.Resource.Ownership.ToString(),
                ra.Notes
            ))
            .ToList();

        var detail = new TripDetailDto(
            trip.Id,
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
            trip.BookedSeats,
            availableSeats,
            trip.FoodInfo,
            trip.PickupDrop,
            trip.AdultPrice,
            trip.AdultSpends,
            trip.AdultMargin,
            trip.ChildPrice,
            trip.ChildSpends,
            trip.ChildMargin,
            totalIncome,
            totalExpenses,
            totalProfit,
            trip.Status.ToString(),
            trip.IsPublished,
            trip.PublicSlug,
            trip.PublishedAt,
            trip.CreatedAt,
            scheduleDtos,
            travellerDtos,
            teamDtos,
            resourceDtos
        );

        return Ok(detail);
    }

    [HttpPost]
    public async Task<ActionResult<TripDetailDto>> CreateTrip([FromBody] CreateTripRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Trip Name is required." });
        }

        if (request.EndDateTime < request.StartDateTime)
        {
            return BadRequest(new { message = "End Date cannot be earlier than Start Date." });
        }

        var tenantId = _tenantService.GetCurrentTenantId();

        // Generate Trip Code if omitted
        var tripCode = request.TripCode;
        if (string.IsNullOrWhiteSpace(tripCode))
        {
            var count = await _context.Trips.CountAsync() + 1;
            tripCode = $"#{count:D4}";
        }

        var trip = new Trip
        {
            TenantId = tenantId,
            TripCode = tripCode,
            Name = request.Name,
            Description = request.Description,
            ThumbnailUrl = request.ThumbnailUrl,
            Category = request.Category ?? "Family Trip",
            Origin = request.Origin,
            Destination = request.Destination,
            Via = request.Via,
            StartDateTime = request.StartDateTime,
            EndDateTime = request.EndDateTime,
            Duration = request.Duration ?? "3D 2N",
            TotalSeats = request.TotalSeats > 0 ? request.TotalSeats : 40,
            BookedSeats = 0,
            FoodInfo = request.FoodInfo ?? "With Food and Snacks",
            PickupDrop = request.PickupDrop ?? "Available with extra charges",
            AdultPrice = request.AdultPrice,
            AdultSpends = request.AdultSpends,
            AdultMargin = request.AdultMargin > 0 ? request.AdultMargin : (request.AdultPrice - request.AdultSpends),
            ChildPrice = request.ChildPrice,
            ChildSpends = request.ChildSpends,
            ChildMargin = request.ChildMargin > 0 ? request.ChildMargin : (request.ChildPrice - request.ChildSpends),
            Status = TripStatus.Upcoming
        };

        if (request.Schedules != null && request.Schedules.Any())
        {
            foreach (var s in request.Schedules)
            {
                trip.Schedules.Add(new TripItinerarySchedule
                {
                    TenantId = tenantId,
                    DayNumber = s.DayNumber,
                    DayDate = s.DayDate,
                    TimeString = s.TimeString,
                    Activity = s.Activity,
                    Location = s.Location
                });
            }
        }

        _context.Trips.Add(trip);

        // Audit Log
        _context.ActivityLogs.Add(new ActivityLog
        {
            TenantId = tenantId,
            UserName = "Current User",
            Action = "Create",
            EntityType = "Trip",
            EntityId = trip.Id,
            Description = $"Created trip {trip.Name} ({trip.TripCode})",
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        var detailRes = await GetTripById(trip.Id);
        var detail = (detailRes.Result as OkObjectResult)?.Value ?? detailRes.Value;
        return CreatedAtAction(nameof(GetTripById), new { id = trip.Id }, detail);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateTrip(Guid id, [FromBody] CreateTripRequest request)
    {
        var trip = await _context.Trips.Include(t => t.Schedules).FirstOrDefaultAsync(t => t.Id == id);
        if (trip == null)
        {
            return NotFound(new { message = "Trip not found." });
        }

        trip.Name = request.Name;
        trip.Description = request.Description;
        trip.ThumbnailUrl = request.ThumbnailUrl;
        trip.Category = request.Category;
        trip.Origin = request.Origin;
        trip.Destination = request.Destination;
        trip.Via = request.Via;
        trip.StartDateTime = request.StartDateTime;
        trip.EndDateTime = request.EndDateTime;
        trip.Duration = request.Duration;
        trip.TotalSeats = request.TotalSeats;
        trip.FoodInfo = request.FoodInfo;
        trip.PickupDrop = request.PickupDrop;
        trip.AdultPrice = request.AdultPrice;
        trip.AdultSpends = request.AdultSpends;
        trip.AdultMargin = request.AdultMargin;
        trip.ChildPrice = request.ChildPrice;
        trip.ChildSpends = request.ChildSpends;
        trip.ChildMargin = request.ChildMargin;
        trip.UpdatedAt = DateTime.UtcNow;

        if (request.Schedules != null)
        {
            _context.TripItinerarySchedules.RemoveRange(trip.Schedules);
            trip.Schedules.Clear();
            foreach (var s in request.Schedules)
            {
                trip.Schedules.Add(new TripItinerarySchedule
                {
                    TenantId = trip.TenantId,
                    TripId = trip.Id,
                    DayNumber = s.DayNumber,
                    DayDate = s.DayDate,
                    TimeString = s.TimeString,
                    Activity = s.Activity,
                    Location = s.Location
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Trip updated successfully." });
    }

    [HttpPost("{id}/publish")]
    public async Task<ActionResult> PublishTrip(Guid id)
    {
        var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Id == id);
        if (trip == null)
        {
            return NotFound(new { message = "Trip not found." });
        }

        if (string.IsNullOrWhiteSpace(trip.Name) || string.IsNullOrWhiteSpace(trip.Destination))
        {
            return BadRequest(new { message = "Trip must have a Name and Destination to be published." });
        }

        // Generate clean URL slug: e.g. kochi-to-munnar-family-trip-0001
        var baseSlug = trip.Name.ToLower()
            .Replace(" ", "-")
            .Replace("&", "and");
        baseSlug = System.Text.RegularExpressions.Regex.Replace(baseSlug, @"[^a-z0-9\-]", "");
        var slug = $"{baseSlug}-{trip.TripCode.Replace("#", "").ToLower()}";

        trip.IsPublished = true;
        trip.PublicSlug = slug;
        trip.PublishedAt = DateTime.UtcNow;
        trip.Status = TripStatus.Active;

        _context.ActivityLogs.Add(new ActivityLog
        {
            TenantId = trip.TenantId,
            UserName = "Current User",
            Action = "Publish",
            EntityType = "Trip",
            EntityId = trip.Id,
            Description = $"Published trip {trip.Name} with public slug {slug}",
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Trip published successfully.",
            publicSlug = slug,
            publicUrl = $"/public/trips/{slug}"
        });
    }

    [HttpPost("{id}/unpublish")]
    public async Task<ActionResult> UnpublishTrip(Guid id)
    {
        var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Id == id);
        if (trip == null)
        {
            return NotFound(new { message = "Trip not found." });
        }

        trip.IsPublished = false;

        _context.ActivityLogs.Add(new ActivityLog
        {
            TenantId = trip.TenantId,
            UserName = "Current User",
            Action = "Unpublish",
            EntityType = "Trip",
            EntityId = trip.Id,
            Description = $"Unpublished trip {trip.Name}",
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(new { message = "Trip unpublished." });
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult> UpdateStatus(Guid id, [FromBody] UpdateTripStatusRequest request)
    {
        var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Id == id);
        if (trip == null)
        {
            return NotFound(new { message = "Trip not found." });
        }

        if (Enum.TryParse<TripStatus>(request.Status, true, out var newStatus))
        {
            trip.Status = newStatus;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Status updated to {newStatus}" });
        }

        return BadRequest(new { message = "Invalid status." });
    }

    [HttpPost("{id}/duplicate")]
    public async Task<ActionResult> DuplicateTrip(Guid id)
    {
        var source = await _context.Trips.Include(t => t.Schedules).FirstOrDefaultAsync(t => t.Id == id);
        if (source == null)
        {
            return NotFound(new { message = "Trip not found." });
        }

        var count = await _context.Trips.CountAsync() + 1;
        var newCode = $"#{count:D4}";

        var clone = new Trip
        {
            TenantId = source.TenantId,
            TripCode = newCode,
            Name = $"{source.Name} (Copy)",
            Description = source.Description,
            Category = source.Category,
            Origin = source.Origin,
            Destination = source.Destination,
            Via = source.Via,
            StartDateTime = source.StartDateTime.AddMonths(1),
            EndDateTime = source.EndDateTime.AddMonths(1),
            Duration = source.Duration,
            TotalSeats = source.TotalSeats,
            BookedSeats = 0,
            FoodInfo = source.FoodInfo,
            PickupDrop = source.PickupDrop,
            AdultPrice = source.AdultPrice,
            AdultSpends = source.AdultSpends,
            AdultMargin = source.AdultMargin,
            ChildPrice = source.ChildPrice,
            ChildSpends = source.ChildSpends,
            ChildMargin = source.ChildMargin,
            Status = TripStatus.Draft
        };

        foreach (var s in source.Schedules)
        {
            clone.Schedules.Add(new TripItinerarySchedule
            {
                TenantId = source.TenantId,
                DayNumber = s.DayNumber,
                DayDate = s.DayDate.AddMonths(1),
                TimeString = s.TimeString,
                Activity = s.Activity,
                Location = s.Location
            });
        }

        _context.Trips.Add(clone);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Trip duplicated successfully.", newTripId = clone.Id });
    }

    [HttpPost("{id}/travellers")]
    public async Task<ActionResult> AddTraveller(Guid id, [FromBody] TripMember traveller)
    {
        var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Id == id);
        if (trip == null)
        {
            return NotFound(new { message = "Trip not found." });
        }

        traveller.TenantId = trip.TenantId;
        traveller.TripId = trip.Id;

        _context.TripMembers.Add(traveller);
        trip.BookedSeats += 1;

        await _context.SaveChangesAsync();
        return Ok(traveller);
    }

    [HttpPost("{id}/team")]
    public async Task<ActionResult> AssignTeam(Guid id, [FromBody] TripTeamAssignment assignment)
    {
        var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Id == id);
        if (trip == null)
        {
            return NotFound(new { message = "Trip not found." });
        }

        assignment.TenantId = trip.TenantId;
        assignment.TripId = trip.Id;

        _context.TripTeamAssignments.Add(assignment);
        await _context.SaveChangesAsync();
        return Ok(assignment);
    }

    [HttpPost("{id}/resources")]
    public async Task<ActionResult> AssignResource(Guid id, [FromBody] TripResourceAssignment assignment)
    {
        var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Id == id);
        if (trip == null)
        {
            return NotFound(new { message = "Trip not found." });
        }

        assignment.TenantId = trip.TenantId;
        assignment.TripId = trip.Id;

        _context.TripResourceAssignments.Add(assignment);

        var res = await _context.Resources.FirstOrDefaultAsync(r => r.Id == assignment.ResourceId);
        if (res != null)
        {
            res.CurrentTripId = trip.Id;
            res.CurrentTripName = trip.Name;
            res.Status = ResourceStatus.InTrip;
        }

        await _context.SaveChangesAsync();
        return Ok(assignment);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteTrip(Guid id)
    {
        var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Id == id);
        if (trip == null)
        {
            return NotFound(new { message = "Trip not found." });
        }

        trip.Status = TripStatus.Archived;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Trip archived successfully." });
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportTripsCsv()
    {
        var trips = await _context.Trips
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Trip ID,Trip Name,Category,Origin,Destination,Start Date,End Date,Duration,Status,Total Seats,Booked Seats,Adult Price,Child Price");

        foreach (var t in trips)
        {
            sb.AppendLine($"\"{t.TripCode}\",\"{t.Name}\",\"{t.Category}\",\"{t.Origin}\",\"{t.Destination}\",\"{t.StartDateTime:yyyy-MM-dd}\",\"{t.EndDateTime:yyyy-MM-dd}\",\"{t.Duration}\",\"{t.Status}\",{t.TotalSeats},{t.BookedSeats},{t.AdultPrice},{t.ChildPrice}");
        }

        return File(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", $"trips_export_{DateTime.UtcNow:yyyyMMdd}.csv");
    }
}
