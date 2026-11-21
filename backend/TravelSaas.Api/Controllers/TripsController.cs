using System.Text;
using System.Text.RegularExpressions;
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
        [FromQuery] int pageSize = 10)
    {
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

        // Universal Search
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(t =>
                t.Name.ToLower().Contains(s) ||
                t.TripCode.ToLower().Contains(s) ||
                t.Origin.ToLower().Contains(s) ||
                t.Destination.ToLower().Contains(s) ||
                t.Category.ToLower().Contains(s)
            );
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(t => t.CreatedAt)
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
            .Include(t => t.Days)
                .ThenInclude(d => d.Schedules)
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

        // Build Itinerary Days with schedules
        var dayDtos = new List<TripItineraryDayDto>();
        if (trip.Days != null && trip.Days.Any())
        {
            dayDtos = trip.Days
                .OrderBy(d => d.DayNumber)
                .Select(d => new TripItineraryDayDto(
                    d.Id,
                    d.DayNumber,
                    d.Title,
                    d.DayDate,
                    d.Schedules.OrderBy(s => s.TimeString).Select(s => new TripScheduleDto(
                        s.Id,
                        s.DayId,
                        s.DayNumber,
                        s.DayDate,
                        s.TimeString,
                        s.Activity,
                        s.Description,
                        s.Origin,
                        s.Destination,
                        s.ActivityType,
                        s.Status.ToString(),
                        s.AssignedPersonResource,
                        s.Notes,
                        s.Location
                    )).ToList()
                ))
                .ToList();
        }
        else if (trip.Schedules != null && trip.Schedules.Any())
        {
            // Backward-compatible grouping if days table wasn't previously populated
            var grouped = trip.Schedules
                .GroupBy(s => s.DayNumber)
                .OrderBy(g => g.Key);

            foreach (var g in grouped)
            {
                var first = g.First();
                dayDtos.Add(new TripItineraryDayDto(
                    Guid.NewGuid(),
                    g.Key,
                    $"Day {g.Key}",
                    first.DayDate,
                    g.OrderBy(s => s.TimeString).Select(s => new TripScheduleDto(
                        s.Id,
                        s.DayId,
                        s.DayNumber,
                        s.DayDate,
                        s.TimeString,
                        s.Activity,
                        s.Description,
                        s.Origin,
                        s.Destination,
                        s.ActivityType,
                        s.Status.ToString(),
                        s.AssignedPersonResource,
                        s.Notes,
                        s.Location
                    )).ToList()
                ));
            }
        }

        var allSchedules = trip.Schedules
            .OrderBy(s => s.DayNumber)
            .ThenBy(s => s.TimeString)
            .Select(s => new TripScheduleDto(
                s.Id,
                s.DayId,
                s.DayNumber,
                s.DayDate,
                s.TimeString,
                s.Activity,
                s.Description,
                s.Origin,
                s.Destination,
                s.ActivityType,
                s.Status.ToString(),
                s.AssignedPersonResource,
                s.Notes,
                s.Location
            ))
            .ToList();

        var travellerDtos = trip.Travellers
            .Select(tr => new TripTravellerDto(
                tr.Id,
                tr.TravellerName,
                tr.Age,
                tr.Gender,
                tr.AgeGender,
                tr.Contact,
                tr.Type,
                tr.PickupLocation,
                tr.DropLocation,
                tr.PaymentStatus.ToString(),
                tr.PaidAmount,
                tr.BalanceAmount,
                tr.FoodInfo,
                tr.CustomFieldsJson ?? "{}"
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

        var assignedMemberIds = trip.TeamAssignments.Select(ta => ta.MemberId).ToList();
        var assignedResourceIds = trip.ResourceAssignments.Select(ra => ra.ResourceId).ToList();

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
            trip.CustomFieldsJson ?? "{}",
            dayDtos,
            allSchedules,
            travellerDtos,
            teamDtos,
            resourceDtos,
            assignedMemberIds,
            assignedResourceIds
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

        // Determine Trip Status: Preserves explicit 'Draft' or user-selected lifecycle status!
        var status = TripStatus.Draft;
        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<TripStatus>(request.Status, true, out var parsedStatus))
        {
            status = parsedStatus;
        }

        var trip = new Trip
        {
            TenantId = tenantId,
            TripCode = tripCode,
            Name = request.Name.Trim(),
            Description = request.Description,
            ThumbnailUrl = request.ThumbnailUrl,
            Category = request.Category ?? "Family Trip",
            Origin = request.Origin?.Trim() ?? string.Empty,
            Destination = request.Destination?.Trim() ?? string.Empty,
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
            Status = status,
            CustomFieldsJson = request.CustomFieldsJson ?? "{}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Populate Days and Schedules
        if (request.Days != null && request.Days.Any())
        {
            foreach (var d in request.Days)
            {
                var dayEntity = new TripItineraryDay
                {
                    Id = d.Id ?? Guid.NewGuid(),
                    TenantId = tenantId,
                    TripId = trip.Id,
                    DayNumber = d.DayNumber,
                    Title = string.IsNullOrWhiteSpace(d.Title) ? $"Day {d.DayNumber}" : d.Title,
                    DayDate = (d.DayDate.HasValue && d.DayDate.Value != default) ? d.DayDate.Value : request.StartDateTime.AddDays(d.DayNumber - 1)
                };
                trip.Days.Add(dayEntity);
            }
        }

        if (request.Schedules != null && request.Schedules.Any())
        {
            foreach (var s in request.Schedules)
            {
                var schedStatus = ScheduleStatus.Scheduled;
                if (!string.IsNullOrWhiteSpace(s.Status) && Enum.TryParse<ScheduleStatus>(s.Status, true, out var parsedSchedStatus))
                {
                    schedStatus = parsedSchedStatus;
                }

                // Associate with Day if possible
                Guid? targetDayId = s.DayId;
                if (!targetDayId.HasValue && trip.Days.Any())
                {
                    var matchingDay = trip.Days.FirstOrDefault(d => d.DayNumber == s.DayNumber);
                    if (matchingDay != null)
                    {
                        targetDayId = matchingDay.Id;
                    }
                }

                var sched = new TripItinerarySchedule
                {
                    Id = s.Id ?? Guid.NewGuid(),
                    TenantId = tenantId,
                    TripId = trip.Id,
                    DayId = targetDayId,
                    DayNumber = s.DayNumber,
                    DayDate = (s.DayDate.HasValue && s.DayDate.Value != default) ? s.DayDate.Value : trip.StartDateTime.AddDays(Math.Max(0, s.DayNumber - 1)),
                    TimeString = !string.IsNullOrWhiteSpace(s.TimeString) ? s.TimeString.Trim() : (!string.IsNullOrWhiteSpace(s.Time) ? s.Time.Trim() : "10:00 AM"),
                    Activity = !string.IsNullOrWhiteSpace(s.Activity) ? s.Activity.Trim() : (!string.IsNullOrWhiteSpace(s.ActivityTitle) ? s.ActivityTitle.Trim() : "Sightseeing"),
                    Description = s.Description,
                    Origin = s.Origin,
                    Destination = s.Destination,
                    ActivityType = s.ActivityType ?? "Sightseeing",
                    Status = schedStatus,
                    AssignedPersonResource = s.AssignedPersonResource,
                    Notes = s.Notes,
                    Location = s.Location
                };

                trip.Schedules.Add(sched);
            }
        }

        // Team Assignments
        if (request.AssignedMemberIds != null)
        {
            foreach (var mId in request.AssignedMemberIds.Distinct())
            {
                var member = await _context.Members.FirstOrDefaultAsync(m => m.Id == mId && m.TenantId == tenantId);
                if (member != null)
                {
                    trip.TeamAssignments.Add(new TripTeamAssignment
                    {
                        TenantId = tenantId,
                        TripId = trip.Id,
                        MemberId = member.Id,
                        AssignedRole = member.Role
                    });
                }
            }
        }

        // Resource Assignments
        if (request.AssignedResourceIds != null)
        {
            foreach (var rId in request.AssignedResourceIds.Distinct())
            {
                var resource = await _context.Resources.FirstOrDefaultAsync(r => r.Id == rId && r.TenantId == tenantId);
                if (resource != null)
                {
                    trip.ResourceAssignments.Add(new TripResourceAssignment
                    {
                        TenantId = tenantId,
                        TripId = trip.Id,
                        ResourceId = resource.Id,
                        Notes = resource.Name
                    });
                }
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
            Description = $"Created trip {trip.Name} ({trip.TripCode}) with status {trip.Status}",
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
        var tenantId = _tenantService.GetCurrentTenantId();
        var trip = await _context.Trips
            .Include(t => t.Days)
            .Include(t => t.Schedules)
            .Include(t => t.TeamAssignments)
            .Include(t => t.ResourceAssignments)
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);

        if (trip == null)
        {
            return NotFound(new { message = "Trip not found." });
        }

        trip.Name = request.Name.Trim();
        trip.Description = request.Description;
        trip.ThumbnailUrl = request.ThumbnailUrl;
        trip.Category = request.Category ?? trip.Category;
        trip.Origin = request.Origin?.Trim() ?? trip.Origin;
        trip.Destination = request.Destination?.Trim() ?? trip.Destination;
        trip.Via = request.Via;
        trip.StartDateTime = request.StartDateTime;
        trip.EndDateTime = request.EndDateTime;
        trip.Duration = request.Duration ?? trip.Duration;
        trip.TotalSeats = request.TotalSeats;
        trip.FoodInfo = request.FoodInfo ?? trip.FoodInfo;
        trip.PickupDrop = request.PickupDrop ?? trip.PickupDrop;
        trip.AdultPrice = request.AdultPrice;
        trip.AdultSpends = request.AdultSpends;
        trip.AdultMargin = request.AdultMargin;
        trip.ChildPrice = request.ChildPrice;
        trip.ChildSpends = request.ChildSpends;
        trip.ChildMargin = request.ChildMargin;
        trip.UpdatedAt = DateTime.UtcNow;

        // Preserve current status unless explicitly changed in request
        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<TripStatus>(request.Status, true, out var parsedStatus))
        {
            trip.Status = parsedStatus;
        }

        if (request.CustomFieldsJson != null)
        {
            trip.CustomFieldsJson = request.CustomFieldsJson;
        }

        // Update Days if supplied
        if (request.Days != null)
        {
            _context.TripItineraryDays.RemoveRange(trip.Days);
            trip.Days.Clear();
            foreach (var d in request.Days)
            {
                trip.Days.Add(new TripItineraryDay
                {
                    Id = d.Id ?? Guid.NewGuid(),
                    TenantId = tenantId,
                    TripId = trip.Id,
                    DayNumber = d.DayNumber,
                    Title = string.IsNullOrWhiteSpace(d.Title) ? $"Day {d.DayNumber}" : d.Title,
                    DayDate = (d.DayDate.HasValue && d.DayDate.Value != default) ? d.DayDate.Value : trip.StartDateTime.AddDays(d.DayNumber - 1)
                });
            }
        }

        // Update Schedules if supplied
        if (request.Schedules != null)
        {
            _context.TripItinerarySchedules.RemoveRange(trip.Schedules);
            trip.Schedules.Clear();
            foreach (var s in request.Schedules)
            {
                var schedStatus = ScheduleStatus.Scheduled;
                if (!string.IsNullOrWhiteSpace(s.Status) && Enum.TryParse<ScheduleStatus>(s.Status, true, out var parsedSchedStatus))
                {
                    schedStatus = parsedSchedStatus;
                }

                Guid? dayId = s.DayId;
                if (!dayId.HasValue && trip.Days.Any())
                {
                    var matchingDay = trip.Days.FirstOrDefault(d => d.DayNumber == s.DayNumber);
                    if (matchingDay != null)
                    {
                        dayId = matchingDay.Id;
                    }
                }

                trip.Schedules.Add(new TripItinerarySchedule
                {
                    Id = s.Id ?? Guid.NewGuid(),
                    TenantId = tenantId,
                    TripId = trip.Id,
                    DayId = dayId,
                    DayNumber = s.DayNumber,
                    DayDate = (s.DayDate.HasValue && s.DayDate.Value != default) ? s.DayDate.Value : trip.StartDateTime.AddDays(Math.Max(0, s.DayNumber - 1)),
                    TimeString = !string.IsNullOrWhiteSpace(s.TimeString) ? s.TimeString.Trim() : (!string.IsNullOrWhiteSpace(s.Time) ? s.Time.Trim() : "10:00 AM"),
                    Activity = !string.IsNullOrWhiteSpace(s.Activity) ? s.Activity.Trim() : (!string.IsNullOrWhiteSpace(s.ActivityTitle) ? s.ActivityTitle.Trim() : "Sightseeing"),
                    Description = s.Description,
                    Origin = s.Origin,
                    Destination = s.Destination,
                    ActivityType = s.ActivityType ?? "Sightseeing",
                    Status = schedStatus,
                    AssignedPersonResource = s.AssignedPersonResource,
                    Notes = s.Notes,
                    Location = s.Location
                });
            }
        }

        // Update Team Assignments if supplied
        if (request.AssignedMemberIds != null)
        {
            _context.TripTeamAssignments.RemoveRange(trip.TeamAssignments);
            trip.TeamAssignments.Clear();
            foreach (var mId in request.AssignedMemberIds.Distinct())
            {
                var member = await _context.Members.FirstOrDefaultAsync(m => m.Id == mId && m.TenantId == tenantId);
                if (member != null)
                {
                    trip.TeamAssignments.Add(new TripTeamAssignment
                    {
                        TenantId = tenantId,
                        TripId = trip.Id,
                        MemberId = member.Id,
                        AssignedRole = member.Role
                    });
                }
            }
        }

        // Update Resource Assignments if supplied
        if (request.AssignedResourceIds != null)
        {
            _context.TripResourceAssignments.RemoveRange(trip.ResourceAssignments);
            trip.ResourceAssignments.Clear();
            foreach (var rId in request.AssignedResourceIds.Distinct())
            {
                var res = await _context.Resources.FirstOrDefaultAsync(r => r.Id == rId && r.TenantId == tenantId);
                if (res != null)
                {
                    trip.ResourceAssignments.Add(new TripResourceAssignment
                    {
                        TenantId = tenantId,
                        TripId = trip.Id,
                        ResourceId = res.Id,
                        Notes = res.Name
                    });
                }
            }
        }

        await _context.SaveChangesAsync();
        var detailRes = await GetTripById(trip.Id);
        var detail = (detailRes.Result as OkObjectResult)?.Value ?? detailRes.Value;
        return Ok(detail);
    }

    [HttpPost("{id}/publish")]
    public async Task<ActionResult> PublishTrip(Guid id)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);
        if (trip == null)
        {
            return NotFound(new { message = "Trip not found." });
        }

        if (string.IsNullOrWhiteSpace(trip.Name) || string.IsNullOrWhiteSpace(trip.Origin) || string.IsNullOrWhiteSpace(trip.Destination))
        {
            return BadRequest(new { message = "Trip must have a valid Name, Origin, and Destination before publishing." });
        }

        var baseSlug = trip.Name.ToLower()
            .Replace(" ", "-")
            .Replace("&", "and");
        baseSlug = Regex.Replace(baseSlug, @"[^a-z0-9\-]", "");
        var slug = $"{baseSlug}-{trip.TripCode.Replace("#", "").ToLower()}";

        trip.IsPublished = true;
        trip.PublicSlug = slug;
        trip.PublishedAt = DateTime.UtcNow;
        trip.Status = TripStatus.Upcoming; // Published active package ready for booking

        _context.ActivityLogs.Add(new ActivityLog
        {
            TenantId = tenantId,
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
        var tenantId = _tenantService.GetCurrentTenantId();
        var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);
        if (trip == null)
        {
            return NotFound(new { message = "Trip not found." });
        }

        trip.IsPublished = false;
        trip.Status = TripStatus.Draft;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Trip unpublished successfully. Public URL disabled." });
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult> UpdateStatus(Guid id, [FromBody] UpdateTripStatusRequest request)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);
        if (trip == null)
        {
            return NotFound(new { message = "Trip not found." });
        }

        if (Enum.TryParse<TripStatus>(request.Status, true, out var newStatus))
        {
            trip.Status = newStatus;
            trip.UpdatedAt = DateTime.UtcNow;

            _context.ActivityLogs.Add(new ActivityLog
            {
                TenantId = tenantId,
                UserName = "Current User",
                Action = "StatusChange",
                EntityType = "Trip",
                EntityId = trip.Id,
                Description = $"Changed trip {trip.Name} status to {newStatus}",
                Timestamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Trip status updated successfully.", status = trip.Status.ToString() });
        }

        return BadRequest(new { message = "Invalid status. Valid statuses: Draft, Upcoming, Active, Completed, Canceled, Archived." });
    }

    // =========================================================================
    // ITINERARY DAY OPERATIONS (Add, Update, Delete, Reorder)
    // =========================================================================
    [HttpPost("{id}/days")]
    public async Task<ActionResult<TripItineraryDayDto>> AddItineraryDay(Guid id, [FromBody] CreateDayItemRequest request)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var trip = await _context.Trips.Include(t => t.Days).FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);
        if (trip == null)
        {
            return NotFound(new { message = "Trip not found." });
        }

        var nextDayNum = trip.Days.Any() ? trip.Days.Max(d => d.DayNumber) + 1 : 1;
        var dayNum = request.DayNumber > 0 ? request.DayNumber : nextDayNum;

        var day = new TripItineraryDay
        {
            TenantId = tenantId,
            TripId = trip.Id,
            DayNumber = dayNum,
            Title = string.IsNullOrWhiteSpace(request.Title) ? $"Day {dayNum}" : request.Title.Trim(),
            DayDate = (request.DayDate.HasValue && request.DayDate.Value != default) ? request.DayDate.Value : trip.StartDateTime.AddDays(dayNum - 1)
        };

        _context.TripItineraryDays.Add(day);
        await _context.SaveChangesAsync();

        return Ok(new TripItineraryDayDto(day.Id, day.DayNumber, day.Title, day.DayDate, new List<TripScheduleDto>()));
    }

    [HttpDelete("{id}/days/{dayId}")]
    public async Task<ActionResult> DeleteItineraryDay(Guid id, Guid dayId)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var day = await _context.TripItineraryDays
            .Include(d => d.Schedules)
            .FirstOrDefaultAsync(d => d.Id == dayId && d.TripId == id && d.TenantId == tenantId);

        if (day == null)
        {
            return NotFound(new { message = "Itinerary day not found." });
        }

        _context.TripItinerarySchedules.RemoveRange(day.Schedules);
        _context.TripItineraryDays.Remove(day);

        // Renumber remaining days sequentially
        var remainingDays = await _context.TripItineraryDays
            .Where(d => d.TripId == id && d.Id != dayId && d.TenantId == tenantId)
            .OrderBy(d => d.DayNumber)
            .ToListAsync();

        for (int i = 0; i < remainingDays.Count; i++)
        {
            remainingDays[i].DayNumber = i + 1;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Itinerary day and its schedules deleted successfully." });
    }

    // =========================================================================
    // INLINE SCHEDULE OPERATIONS (Add, Update, Delete)
    // =========================================================================
    [HttpPost("{id}/schedules")]
    public async Task<ActionResult<TripScheduleDto>> AddSchedule(Guid id, [FromBody] CreateScheduleItemRequest request)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var trip = await _context.Trips.Include(t => t.Days).FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);
        if (trip == null)
        {
            return NotFound(new { message = "Trip not found." });
        }

        var activity = !string.IsNullOrWhiteSpace(request.Activity) ? request.Activity.Trim() : request.ActivityTitle?.Trim();
        if (string.IsNullOrWhiteSpace(activity))
        {
            return BadRequest(new { message = "Activity title is required." });
        }

        var schedStatus = ScheduleStatus.Scheduled;
        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<ScheduleStatus>(request.Status, true, out var parsedStatus))
        {
            schedStatus = parsedStatus;
        }

        Guid? dayId = request.DayId;
        if (!dayId.HasValue && trip.Days.Any())
        {
            var match = trip.Days.FirstOrDefault(d => d.DayNumber == request.DayNumber);
            if (match != null) dayId = match.Id;
        }

        var schedule = new TripItinerarySchedule
        {
            TenantId = tenantId,
            TripId = trip.Id,
            DayId = dayId,
            DayNumber = request.DayNumber,
            DayDate = (request.DayDate.HasValue && request.DayDate.Value != default) ? request.DayDate.Value : trip.StartDateTime.AddDays(Math.Max(0, request.DayNumber - 1)),
            TimeString = !string.IsNullOrWhiteSpace(request.TimeString) ? request.TimeString.Trim() : (!string.IsNullOrWhiteSpace(request.Time) ? request.Time.Trim() : "10:00 AM"),
            Activity = activity,
            Description = request.Description,
            Origin = request.Origin,
            Destination = request.Destination,
            ActivityType = request.ActivityType ?? "Sightseeing",
            Status = schedStatus,
            AssignedPersonResource = request.AssignedPersonResource,
            Notes = request.Notes,
            Location = request.Location
        };

        _context.TripItinerarySchedules.Add(schedule);
        await _context.SaveChangesAsync();

        return Ok(new TripScheduleDto(
            schedule.Id,
            schedule.DayId,
            schedule.DayNumber,
            schedule.DayDate,
            schedule.TimeString,
            schedule.Activity,
            schedule.Description,
            schedule.Origin,
            schedule.Destination,
            schedule.ActivityType,
            schedule.Status.ToString(),
            schedule.AssignedPersonResource,
            schedule.Notes,
            schedule.Location
        ));
    }

    [HttpPut("{id}/schedules/{scheduleId}")]
    public async Task<ActionResult<TripScheduleDto>> UpdateSchedule(Guid id, Guid scheduleId, [FromBody] CreateScheduleItemRequest request)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var schedule = await _context.TripItinerarySchedules.FirstOrDefaultAsync(s => s.Id == scheduleId && s.TripId == id && s.TenantId == tenantId);
        if (schedule == null)
        {
            return NotFound(new { message = "Schedule item not found." });
        }

        if (!string.IsNullOrWhiteSpace(request.TimeString)) schedule.TimeString = request.TimeString.Trim();
        if (!string.IsNullOrWhiteSpace(request.Activity)) schedule.Activity = request.Activity.Trim();
        schedule.Description = request.Description;
        schedule.Origin = request.Origin;
        schedule.Destination = request.Destination;
        if (!string.IsNullOrWhiteSpace(request.ActivityType)) schedule.ActivityType = request.ActivityType;
        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<ScheduleStatus>(request.Status, true, out var ps))
        {
            schedule.Status = ps;
        }
        schedule.AssignedPersonResource = request.AssignedPersonResource;
        schedule.Notes = request.Notes;
        schedule.Location = request.Location;

        await _context.SaveChangesAsync();

        return Ok(new TripScheduleDto(
            schedule.Id,
            schedule.DayId,
            schedule.DayNumber,
            schedule.DayDate,
            schedule.TimeString,
            schedule.Activity,
            schedule.Description,
            schedule.Origin,
            schedule.Destination,
            schedule.ActivityType,
            schedule.Status.ToString(),
            schedule.AssignedPersonResource,
            schedule.Notes,
            schedule.Location
        ));
    }

    [HttpDelete("{id}/schedules/{scheduleId}")]
    public async Task<ActionResult> DeleteSchedule(Guid id, Guid scheduleId)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var schedule = await _context.TripItinerarySchedules.FirstOrDefaultAsync(s => s.Id == scheduleId && s.TripId == id && s.TenantId == tenantId);
        if (schedule == null)
        {
            return NotFound(new { message = "Schedule item not found." });
        }

        _context.TripItinerarySchedules.Remove(schedule);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Schedule item removed successfully." });
    }

    // =========================================================================
    // TRAVELLER OPERATIONS (Add, Delete) - Structured Input & 400 Bad Request Fix!
    // =========================================================================
    [HttpPost("{id}/travellers")]
    public async Task<ActionResult<TripTravellerDto>> AddTraveller(Guid id, [FromBody] AddTravellerRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TravellerName))
        {
            return BadRequest(new { message = "Traveller Name is required." });
        }

        var tenantId = _tenantService.GetCurrentTenantId();
        var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);
        if (trip == null)
        {
            return NotFound(new { message = "Trip not found." });
        }

        var age = request.Age.GetValueOrDefault(28);
        var gender = !string.IsNullOrWhiteSpace(request.Gender) ? request.Gender.Trim() : "Female";
        var ageGender = $"{age} / {gender}";

        var paymentStatus = PaymentStatus.Paid;
        if (!string.IsNullOrWhiteSpace(request.PaymentStatus) && Enum.TryParse<PaymentStatus>(request.PaymentStatus, true, out var parsedPs))
        {
            paymentStatus = parsedPs;
        }

        var paidAmount = request.PaidAmount.GetValueOrDefault(trip.AdultPrice);
        var balanceAmount = request.BalanceAmount.GetValueOrDefault(Math.Max(0, trip.AdultPrice - paidAmount));

        var traveller = new TripMember
        {
            TenantId = tenantId,
            TripId = trip.Id,
            TravellerName = request.TravellerName.Trim(),
            Age = age,
            Gender = gender,
            AgeGender = ageGender,
            Contact = request.Contact?.Trim() ?? string.Empty,
            Type = request.Type ?? "Main",
            PickupLocation = request.PickupLocation?.Trim(),
            DropLocation = request.DropLocation?.Trim(),
            PaymentStatus = paymentStatus,
            PaidAmount = paidAmount,
            BalanceAmount = balanceAmount,
            FoodInfo = request.FoodInfo ?? "Non-Veg",
            CustomFieldsJson = request.CustomFieldsJson ?? "{}"
        };

        _context.TripMembers.Add(traveller);
        trip.BookedSeats += 1;

        await _context.SaveChangesAsync();

        return Ok(new TripTravellerDto(
            traveller.Id,
            traveller.TravellerName,
            traveller.Age,
            traveller.Gender,
            traveller.AgeGender,
            traveller.Contact,
            traveller.Type,
            traveller.PickupLocation,
            traveller.DropLocation,
            traveller.PaymentStatus.ToString(),
            traveller.PaidAmount,
            traveller.BalanceAmount,
            traveller.FoodInfo,
            traveller.CustomFieldsJson
        ));
    }

    [HttpDelete("{id}/travellers/{travellerId}")]
    public async Task<ActionResult> DeleteTraveller(Guid id, Guid travellerId)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);
        if (trip == null)
        {
            return NotFound(new { message = "Trip not found." });
        }

        var traveller = await _context.TripMembers.FirstOrDefaultAsync(m => m.Id == travellerId && m.TripId == id && m.TenantId == tenantId);
        if (traveller == null)
        {
            return NotFound(new { message = "Traveller not found." });
        }

        _context.TripMembers.Remove(traveller);
        trip.BookedSeats = Math.Max(0, trip.BookedSeats - 1);

        await _context.SaveChangesAsync();
        return Ok(new { message = "Traveller removed successfully." });
    }

    // =========================================================================
    // TEAM & RESOURCE ASSIGNMENTS
    // =========================================================================
    [HttpPost("{id}/team")]
    public async Task<ActionResult> AssignTeam(Guid id, [FromBody] TripTeamAssignment assignment)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);
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
        var tenantId = _tenantService.GetCurrentTenantId();
        var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);
        if (trip == null)
        {
            return NotFound(new { message = "Trip not found." });
        }

        assignment.TenantId = trip.TenantId;
        assignment.TripId = trip.Id;

        _context.TripResourceAssignments.Add(assignment);

        var res = await _context.Resources.FirstOrDefaultAsync(r => r.Id == assignment.ResourceId && r.TenantId == tenantId);
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
        var tenantId = _tenantService.GetCurrentTenantId();
        var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);
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
        var tenantId = _tenantService.GetCurrentTenantId();
        var trips = await _context.Trips
            .Where(t => t.TenantId == tenantId)
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
