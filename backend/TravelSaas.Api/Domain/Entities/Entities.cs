using TravelSaas.Api.Domain.Enums;

namespace TravelSaas.Api.Domain.Entities;

public interface ITenantScoped
{
    Guid TenantId { get; set; }
}

public class Tenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class User : ITenantScoped
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = "Owner"; // Owner, Admin, Manager, Staff, Viewer
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Trip : ITenantScoped
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string TripCode { get; set; } = string.Empty; // e.g. #0001
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string Category { get; set; } = "Family Trip"; // Honeymoon, Family Trip, Couple, Adventure
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public string? Via { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public string Duration { get; set; } = "3D 2N";
    public int TotalSeats { get; set; } = 40;
    public int BookedSeats { get; set; } = 0;
    public string FoodInfo { get; set; } = "With Food and Snacks";
    public string PickupDrop { get; set; } = "Available with extra charges";
    
    // Adult pricing & margins
    public decimal AdultPrice { get; set; }
    public decimal AdultSpends { get; set; }
    public decimal AdultMargin { get; set; }
    
    // Child pricing & margins
    public decimal ChildPrice { get; set; }
    public decimal ChildSpends { get; set; }
    public decimal ChildMargin { get; set; }

    public TripStatus Status { get; set; } = TripStatus.Draft;
    
    // Publishing fields
    public bool IsPublished { get; set; }
    public string? PublicSlug { get; set; }
    public DateTime? PublishedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Dynamic custom fields
    public string CustomFieldsJson { get; set; } = "{}";

    public List<TripItineraryDay> Days { get; set; } = new();
    public List<TripItinerarySchedule> Schedules { get; set; } = new();
    public List<TripMember> Travellers { get; set; } = new();
    public List<TripTeamAssignment> TeamAssignments { get; set; } = new();
    public List<TripResourceAssignment> ResourceAssignments { get; set; } = new();
    public List<Payment> Payments { get; set; } = new();
}

public class TripItineraryDay : ITenantScoped
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid TripId { get; set; }
    public int DayNumber { get; set; } = 1;
    public string Title { get; set; } = string.Empty;
    public DateTime DayDate { get; set; }
    public List<TripItinerarySchedule> Schedules { get; set; } = new();
}

public class TripItinerarySchedule : ITenantScoped
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid TripId { get; set; }
    public Guid? DayId { get; set; }
    public int DayNumber { get; set; } = 1;
    public DateTime DayDate { get; set; }
    public string TimeString { get; set; } = "10:00 AM";
    public string Activity { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Origin { get; set; }
    public string? Destination { get; set; }
    public string ActivityType { get; set; } = "Sightseeing"; // Transit, Sightseeing, Meal, Activity, Accommodation, Leisure
    public ScheduleStatus Status { get; set; } = ScheduleStatus.Scheduled;
    public string? AssignedPersonResource { get; set; }
    public string? Notes { get; set; }
    public string? Location { get; set; }
}

public class TripMember : ITenantScoped
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid TripId { get; set; }
    public Guid? MemberId { get; set; }
    public string TravellerName { get; set; } = string.Empty;
    public string AgeGender { get; set; } = "28 / Female";
    public int Age { get; set; } = 28;
    public string Gender { get; set; } = "Female";
    public string Contact { get; set; } = string.Empty;
    public string Type { get; set; } = "Main"; // Main, Sub
    public string? PickupLocation { get; set; }
    public string? DropLocation { get; set; }
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Paid;
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string FoodInfo { get; set; } = "Non-Veg"; // Veg, Non-Veg
    public string CustomFieldsJson { get; set; } = "{}";
}

public class TripTeamAssignment : ITenantScoped
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid TripId { get; set; }
    public Guid MemberId { get; set; }
    public Member? Member { get; set; }
    public string AssignedRole { get; set; } = string.Empty; // Driver, Guider, Helper, Staff
    public string? Notes { get; set; }
}

public class Member : ITenantScoped
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string MemberCode { get; set; } = string.Empty; // e.g. #D1, #0010
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string MobileNo { get; set; } = string.Empty;
    public string? AadhaarNo { get; set; }
    public string? LicenseNo { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public int Age { get; set; } = 28;
    public string Gender { get; set; } = "Male";
    public string BloodGroup { get; set; } = "O+";
    public string FoodInfo { get; set; } = "Non-Veg"; // Veg, Non-Veg
    public string Role { get; set; } = "Driver"; // Guider, Driver, Staff, Helper, Manager, Admin
    public string WorkType { get; set; } = "Full-time (Contract)"; // Full-time, Part-time, Full-time (Contract)
    public string ContractPeriod { get; set; } = "2 years";
    public DateTime WorkJoinDate { get; set; } = DateTime.UtcNow;
    public DateTime? WorkEndDate { get; set; }
    public string SalaryPeriod { get; set; } = "Weekly"; // Weekly, Monthly, Per Trip
    public string? Address { get; set; }
    public string? PhotoUrl { get; set; }
    public string? DocumentUrl { get; set; }
    public MemberStatus Status { get; set; } = MemberStatus.Available;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // JSON dictionary for dynamic custom fields
    public string CustomFieldsJson { get; set; } = "{}";

    public List<TripTeamAssignment> TripAssignments { get; set; } = new();
    public List<Payment> Payments { get; set; } = new();
}

public class ResourceType : ITenantScoped
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string Key { get; set; } = string.Empty; // vehicle, hotel, restaurant, lodge, guide, driver, activity
    public string DisplayName { get; set; } = string.Empty; // Vehicles, Hotels, Restaurants, Lodges
    public string Icon { get; set; } = "truck";
    public int DisplayOrder { get; set; } = 0;
    public bool IsSystem { get; set; } = true;
    public List<ResourceFieldDefinition> FieldDefinitions { get; set; } = new();
}

public class ResourceFieldDefinition : ITenantScoped
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid ResourceTypeId { get; set; }
    public string FieldKey { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string DataType { get; set; } = "text"; // text, number, select, date, boolean
    public bool IsRequired { get; set; }
    public bool ShowInTable { get; set; } = true;
    public string? OptionsJson { get; set; } // ["Deluxe", "Suite"] or []
    public int DisplayOrder { get; set; }
}

public class Resource : ITenantScoped
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid ResourceTypeId { get; set; }
    public ResourceType? ResourceType { get; set; }
    public string Code { get; set; } = string.Empty; // #0047
    public string Name { get; set; } = string.Empty; // Model Name or Hotel Name or Restaurant Name
    public string? IdentificationNo { get; set; } // Vehicle No TN07 5387 or License / Registration No
    public OwnershipType Ownership { get; set; } = OwnershipType.Own; // Own, Partner
    public string? PartnerName { get; set; }
    public string? ContactNo { get; set; }
    public string? Address { get; set; }
    public ResourceStatus Status { get; set; } = ResourceStatus.Available;
    public string? PictureUrl { get; set; }
    public string? InsurancePeriod { get; set; }
    public Guid? CurrentTripId { get; set; }
    public string? CurrentTripName { get; set; }
    
    // Dynamic values stored as JSON
    public string CustomValuesJson { get; set; } = "{}";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class TripResourceAssignment : ITenantScoped
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid TripId { get; set; }
    public Guid ResourceId { get; set; }
    public Resource? Resource { get; set; }
    public string? Notes { get; set; }
}

public class Payment : ITenantScoped
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid? TripId { get; set; }
    public string? TripCode { get; set; }
    public string? TripName { get; set; }
    public Guid? MemberId { get; set; }
    public string? MemberName { get; set; }
    public decimal Amount { get; set; }
    public decimal Balance { get; set; }
    public PaymentMode PaymentMode { get; set; } = PaymentMode.Online;
    public PaymentStatus Status { get; set; } = PaymentStatus.Paid;
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public string? WorkingPeriod { get; set; }
    public string? DaysCount { get; set; }
    public string? ReceiptNumber { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class CustomFieldDefinition : ITenantScoped
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string TargetEntity { get; set; } = "Trip"; // Module: Trip, Traveller, TeamMember, Vehicle, Hotel, Restaurant, Lodge, Activity
    public string FieldKey { get; set; } = string.Empty;
    public string FieldLabel { get; set; } = string.Empty;
    public string FieldType { get; set; } = "text"; // text, textarea, number, currency, date, time, select, multiselect, boolean, email, phone, url
    public bool IsRequired { get; set; }
    public bool ShowInTable { get; set; }
    public string? OptionsJson { get; set; }
    public string? DefaultValue { get; set; }
    public int SortOrder { get; set; } = 0;
    public bool IsArchived { get; set; } = false; // Safe lifecycle: Soft archive protects historical customer data!
    public string? ValidationRulesJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class ActivityLog : ITenantScoped
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid? UserId { get; set; }
    public string UserName { get; set; } = "System";
    public string Action { get; set; } = string.Empty; // Create, Update, Delete, Publish, StatusChange
    public string EntityType { get; set; } = string.Empty; // Trip, Member, Resource, Payment
    public Guid? EntityId { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class ConfigItem : ITenantScoped
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string Category { get; set; } = "TripCategory"; // TripCategory, TripType, BloodGroup, FoodOption, Role, WorkType
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

