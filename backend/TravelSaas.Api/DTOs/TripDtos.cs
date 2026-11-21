using TravelSaas.Api.Domain.Enums;

namespace TravelSaas.Api.DTOs;

public record TripListDto(
    Guid Id,
    string TripCode,
    string Name,
    string? Category,
    string Location,
    string TripPeriod,
    string Days,
    string LastBookingDate,
    string TripStatus,
    int TotalSeats,
    int AvailableSeats,
    int BookedSeats,
    decimal AdultPrice,
    decimal ChildPrice,
    bool IsPublished,
    string? PublicSlug
);

public record TripDetailDto(
    Guid Id,
    string TripCode,
    string Name,
    string? Description,
    string? ThumbnailUrl,
    string Category,
    string Origin,
    string Destination,
    string? Via,
    DateTime StartDateTime,
    DateTime EndDateTime,
    string Duration,
    int TotalSeats,
    int BookedSeats,
    int AvailableSeats,
    string FoodInfo,
    string PickupDrop,
    decimal AdultPrice,
    decimal AdultSpends,
    decimal AdultMargin,
    decimal ChildPrice,
    decimal ChildSpends,
    decimal ChildMargin,
    decimal TotalIncome,
    decimal TotalExpenses,
    decimal TotalProfit,
    string Status,
    bool IsPublished,
    string? PublicSlug,
    DateTime? PublishedAt,
    DateTime CreatedAt,
    string CustomFieldsJson,
    List<TripItineraryDayDto> Days,
    List<TripScheduleDto> Schedules,
    List<TripTravellerDto> Travellers,
    List<TripTeamMemberDto> TeamMembers,
    List<TripResourceDto> Resources,
    List<Guid> AssignedTeamMemberIds,
    List<Guid> AssignedResourceIds
);

public record TripItineraryDayDto(
    Guid Id,
    int DayNumber,
    string Title,
    DateTime DayDate,
    List<TripScheduleDto> Schedules
);

public record TripScheduleDto(
    Guid Id,
    Guid? DayId,
    int DayNumber,
    DateTime DayDate,
    string TimeString,
    string Activity,
    string? Description,
    string? Origin,
    string? Destination,
    string ActivityType,
    string Status,
    string? AssignedPersonResource,
    string? Notes,
    string? Location
);

public record TripTravellerDto(
    Guid Id,
    string TravellerName,
    int Age,
    string Gender,
    string AgeGender,
    string Contact,
    string Type,
    string? PickupLocation,
    string? DropLocation,
    string PaymentStatus,
    decimal PaidAmount,
    decimal BalanceAmount,
    string FoodInfo,
    string CustomFieldsJson
);

public record TripTeamMemberDto(
    Guid Id,
    Guid MemberId,
    string MemberCode,
    string Name,
    string Contact,
    string Role,
    string AgeGender,
    string? LicenseNo,
    string WorkType,
    string FoodInfo
);

public record TripResourceDto(
    Guid Id,
    Guid ResourceId,
    string ResourceCode,
    string Name,
    string ResourceType,
    string Ownership,
    string? Notes
);

public record CreateTripRequest(
    string? TripCode,
    string Name,
    string? Description,
    string? ThumbnailUrl,
    string? Category,
    string? Origin,
    string? Destination,
    string? Via,
    DateTime StartDateTime,
    DateTime EndDateTime,
    string? Duration,
    int TotalSeats,
    string? FoodInfo,
    string? PickupDrop,
    decimal AdultPrice,
    decimal AdultSpends,
    decimal AdultMargin,
    decimal ChildPrice,
    decimal ChildSpends,
    decimal ChildMargin,
    string? Status,
    string? CustomFieldsJson,
    List<Guid>? AssignedMemberIds,
    List<Guid>? AssignedResourceIds,
    List<CreateDayItemRequest>? Days,
    List<CreateScheduleItemRequest>? Schedules
);

public record CreateDayItemRequest(
    Guid? Id,
    int DayNumber,
    string? Title,
    DateTime? DayDate
);

public record CreateScheduleItemRequest(
    Guid? Id,
    Guid? DayId,
    int DayNumber,
    DateTime? DayDate,
    string? TimeString,
    string? Time,
    string? Activity,
    string? ActivityTitle,
    string? Description,
    string? Origin,
    string? Destination,
    string? ActivityType,
    string? Status,
    string? AssignedPersonResource,
    string? Notes,
    string? Location
);

public record AddTravellerRequest(
    string TravellerName,
    int? Age,
    string? Gender,
    string? Contact,
    string? Type,
    string? PickupLocation,
    string? DropLocation,
    string? PaymentStatus,
    decimal? PaidAmount,
    decimal? BalanceAmount,
    string? FoodInfo,
    string? CustomFieldsJson
);

public record UpdateTripStatusRequest(string Status);

// Strict Public Trip DTO: Excludes internal financials, private traveller data, and internal team details!
public record PublicTripDto(
    string TripCode,
    string Name,
    string? Description,
    string? ThumbnailUrl,
    string Category,
    string Origin,
    string Destination,
    string? Via,
    DateTime StartDateTime,
    DateTime EndDateTime,
    string Duration,
    int TotalSeats,
    int AvailableSeats,
    string FoodInfo,
    string PickupDrop,
    decimal AdultPrice,
    decimal ChildPrice,
    string CompanyName,
    string? CompanyLogo,
    List<PublicTripScheduleDto> Itinerary
);

public record PublicTripScheduleDto(
    int DayNumber,
    DateTime DayDate,
    string TimeString,
    string Activity,
    string? Location
);
