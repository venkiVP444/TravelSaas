namespace TravelSaas.Api.DTOs;

public record DashboardStatsDto(
    int TotalTrips,
    int UpcomingTrips,
    decimal TotalRevenue,
    int TotalTravellers,
    int ActiveResources,
    int TotalTeamMembers,
    List<RecentActivityDto> RecentActivities
);

public record RecentActivityDto(
    Guid Id,
    string UserName,
    string Action,
    string EntityType,
    string Description,
    DateTime Timestamp
);

