using System.Text.Json;
using TravelSaas.Api.Domain.Entities;
using TravelSaas.Api.Domain.Enums;
using TravelSaas.Api.Services;

namespace TravelSaas.Api.Data;

public static class DbInitializer
{
    private static DateTime UtcDate(int year, int month, int day, int hour = 0, int minute = 0, int second = 0) =>
        new DateTime(year, month, day, hour, minute, second, DateTimeKind.Utc);

    public static async Task SeedAsync(AppDbContext context, IAuthService authService)
    {
        if (context.Tenants.Any())
        {
            return; // Already seeded
        }

        var tenantId = Constants.DefaultTenantId;
        var secondaryTenantId = Constants.SecondaryTenantId;

        // 1. Tenants
        var tenant1 = new Tenant
        {
            Id = tenantId,
            Name = "V4Journey Pvt Ltd",
            Slug = "v4journey",
            LogoUrl = "/assets/v4journey-logo.png",
            CreatedAt = DateTime.UtcNow
        };

        var tenant2 = new Tenant
        {
            Id = secondaryTenantId,
            Name = "SkyWay Holidays",
            Slug = "skyway",
            CreatedAt = DateTime.UtcNow
        };

        context.Tenants.AddRange(tenant1, tenant2);

        // 2. Users
        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Email = "admin@v4journey.com",
            PasswordHash = authService.HashPassword("Admin@123"),
            FullName = "Venkatesh V (Director)",
            Role = "Owner"
        };

        var managerUser = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Email = "punitha@v4journey.com",
            PasswordHash = authService.HashPassword("Punitha@123"),
            FullName = "Punitha S (Operations Manager)",
            Role = "Manager"
        };

        var tenant2User = new User
        {
            Id = Guid.NewGuid(),
            TenantId = secondaryTenantId,
            Email = "operator@skyway.com",
            PasswordHash = authService.HashPassword("SkyWay@123"),
            FullName = "Ramesh Kumar",
            Role = "Owner"
        };

        context.Users.AddRange(adminUser, managerUser, tenant2User);

        // 3. Resource Types & Field Definitions
        var vehicleType = new ResourceType
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Key = "vehicle",
            DisplayName = "Vehicles",
            Icon = "truck",
            DisplayOrder = 1,
            IsSystem = true,
            FieldDefinitions = new List<ResourceFieldDefinition>
            {
                new() { Id = Guid.NewGuid(), TenantId = tenantId, FieldKey = "modelName", Label = "Model Name", DataType = "text", IsRequired = true, ShowInTable = true, DisplayOrder = 1 },
                new() { Id = Guid.NewGuid(), TenantId = tenantId, FieldKey = "vehicleNo", Label = "Vehicle No", DataType = "text", IsRequired = true, ShowInTable = true, DisplayOrder = 2 },
                new() { Id = Guid.NewGuid(), TenantId = tenantId, FieldKey = "seatingCapacity", Label = "Seating Capacity", DataType = "number", IsRequired = true, ShowInTable = true, DisplayOrder = 3 },
                new() { Id = Guid.NewGuid(), TenantId = tenantId, FieldKey = "acType", Label = "AC / Non-AC", DataType = "select", OptionsJson = JsonSerializer.Serialize(new[] { "AC", "Non-AC" }), IsRequired = true, ShowInTable = false, DisplayOrder = 4 },
                new() { Id = Guid.NewGuid(), TenantId = tenantId, FieldKey = "insurancePeriod", Label = "Insurance Period", DataType = "text", IsRequired = false, ShowInTable = true, DisplayOrder = 5 }
            }
        };

        var hotelType = new ResourceType
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Key = "hotel",
            DisplayName = "Hotels",
            Icon = "hotel",
            DisplayOrder = 2,
            IsSystem = true,
            FieldDefinitions = new List<ResourceFieldDefinition>
            {
                new() { Id = Guid.NewGuid(), TenantId = tenantId, FieldKey = "category", Label = "Category", DataType = "select", OptionsJson = JsonSerializer.Serialize(new[] { "3 Star", "4 Star", "5 Star", "Heritage", "Resort" }), IsRequired = true, ShowInTable = true, DisplayOrder = 1 },
                new() { Id = Guid.NewGuid(), TenantId = tenantId, FieldKey = "city", Label = "City", DataType = "text", IsRequired = true, ShowInTable = true, DisplayOrder = 2 },
                new() { Id = Guid.NewGuid(), TenantId = tenantId, FieldKey = "roomTypes", Label = "Room Types", DataType = "text", IsRequired = false, ShowInTable = true, DisplayOrder = 3 },
                new() { Id = Guid.NewGuid(), TenantId = tenantId, FieldKey = "checkinTime", Label = "Check-in", DataType = "text", IsRequired = false, ShowInTable = false, DisplayOrder = 4 }
            }
        };

        var restaurantType = new ResourceType
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Key = "restaurant",
            DisplayName = "Restaurants",
            Icon = "utensils",
            DisplayOrder = 3,
            IsSystem = true,
            FieldDefinitions = new List<ResourceFieldDefinition>
            {
                new() { Id = Guid.NewGuid(), TenantId = tenantId, FieldKey = "cuisine", Label = "Cuisine", DataType = "text", IsRequired = true, ShowInTable = true, DisplayOrder = 1 },
                new() { Id = Guid.NewGuid(), TenantId = tenantId, FieldKey = "location", Label = "Location", DataType = "text", IsRequired = true, ShowInTable = true, DisplayOrder = 2 },
                new() { Id = Guid.NewGuid(), TenantId = tenantId, FieldKey = "mealTypes", Label = "Meal Types", DataType = "select", OptionsJson = JsonSerializer.Serialize(new[] { "Buffet", "A La Carte", "Both" }), IsRequired = false, ShowInTable = false, DisplayOrder = 3 }
            }
        };

        var lodgeType = new ResourceType
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Key = "lodge",
            DisplayName = "Lodges",
            Icon = "home",
            DisplayOrder = 4,
            IsSystem = true,
            FieldDefinitions = new List<ResourceFieldDefinition>
            {
                new() { Id = Guid.NewGuid(), TenantId = tenantId, FieldKey = "roomCount", Label = "Rooms", DataType = "number", IsRequired = true, ShowInTable = true, DisplayOrder = 1 },
                new() { Id = Guid.NewGuid(), TenantId = tenantId, FieldKey = "lodgeType", Label = "Lodge Type", DataType = "select", OptionsJson = JsonSerializer.Serialize(new[] { "Eco Lodge", "Standard", "Cottage" }), IsRequired = false, ShowInTable = true, DisplayOrder = 2 }
            }
        };

        context.ResourceTypes.AddRange(vehicleType, hotelType, restaurantType, lodgeType);

        // 4. Resources
        var vehicle1 = new Resource
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ResourceTypeId = vehicleType.Id,
            Code = "#0047",
            Name = "Honda Traveler",
            IdentificationNo = "TN07 5387",
            Ownership = OwnershipType.Own,
            InsurancePeriod = "till 15 Dec 2029",
            Status = ResourceStatus.InTrip,
            CurrentTripName = "Kochi to Munnar family trip",
            CustomValuesJson = JsonSerializer.Serialize(new { modelName = "Honda Traveler", vehicleNo = "TN07 5387", seatingCapacity = 40, acType = "AC", insurancePeriod = "till 15 Dec 2029" })
        };

        var vehicle2 = new Resource
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ResourceTypeId = vehicleType.Id,
            Code = "#0048",
            Name = "Swift Traveler",
            IdentificationNo = "TN11 2587",
            Ownership = OwnershipType.Partner,
            PartnerName = "Sai Traders",
            ContactNo = "+91 9080702373",
            Address = "No.41, Viruthunagar Main Rd",
            InsurancePeriod = "till 28 Sep 2029",
            Status = ResourceStatus.None,
            CustomValuesJson = JsonSerializer.Serialize(new { modelName = "Swift Traveler", vehicleNo = "TN11 2587", seatingCapacity = 20, acType = "AC", insurancePeriod = "till 28 Sep 2029" })
        };

        var hotel1 = new Resource
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ResourceTypeId = hotelType.Id,
            Code = "#H01",
            Name = "Grand Munnar Luxury Resort",
            IdentificationNo = "REG-MNR-44",
            Ownership = OwnershipType.Partner,
            PartnerName = "Hillside Resorts Corp",
            ContactNo = "+91 9443219988",
            Address = "Tea Estate View, Munnar",
            Status = ResourceStatus.Available,
            CustomValuesJson = JsonSerializer.Serialize(new { category = "4 Star", city = "Munnar", roomTypes = "Deluxe, Family Suite", checkinTime = "12:00 PM" })
        };

        var restaurant1 = new Resource
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ResourceTypeId = restaurantType.Id,
            Code = "#R01",
            Name = "Spice Garden Family Restaurant",
            IdentificationNo = "FSSAI-88339",
            Ownership = OwnershipType.Partner,
            PartnerName = "Kerala Tastes Group",
            ContactNo = "+91 9884523311",
            Address = "Kochi - Munnar Highway",
            Status = ResourceStatus.Available,
            CustomValuesJson = JsonSerializer.Serialize(new { cuisine = "Traditional Kerala & Continental", location = "Highway Bypass", mealTypes = "Both" })
        };

        context.Resources.AddRange(vehicle1, vehicle2, hotel1, restaurant1);

        // 5. Team Members
        var driverRahul = new Member
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            MemberCode = "#D1",
            FullName = "L.K.Rahul Sharma",
            Email = "rahul.driver@v4journey.com",
            MobileNo = "+91 8300658968",
            AadhaarNo = "4567 6789 0987",
            LicenseNo = "210LN38HP",
            DateOfBirth = UtcDate(1998, 6, 27),
            Age = 28,
            Gender = "Male",
            BloodGroup = "AB+",
            FoodInfo = "Non-Veg",
            Role = "Driver",
            WorkType = "Full-time (Contract)",
            ContractPeriod = "2 years",
            WorkJoinDate = UtcDate(2026, 12, 15),
            WorkEndDate = UtcDate(2029, 12, 15),
            SalaryPeriod = "Weekly",
            Address = "L.74, Vinayagar Kovil Street, Stage-3, T.N.H.B.Colony, K.T.C Nagar, Palayamkottai, Tirunelveli - 627011",
            Status = MemberStatus.Available,
            CustomFieldsJson = JsonSerializer.Serialize(new { passportExpiry = "2032-05-15", emergencyContact = "9442890000 (Father)" })
        };

        var helperShiva = new Member
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            MemberCode = "#H7",
            FullName = "P.Shiva",
            Email = "shiva.h7@v4journey.com",
            MobileNo = "+91 8300658968",
            Age = 29,
            Gender = "Male",
            BloodGroup = "O+",
            FoodInfo = "Veg",
            Role = "Helper",
            WorkType = "Part-time",
            Status = MemberStatus.Available
        };

        var guiderSuresh = new Member
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            MemberCode = "#G4",
            FullName = "S.Suresh",
            Email = "suresh.g4@v4journey.com",
            MobileNo = "+91 8300658968",
            Age = 37,
            Gender = "Male",
            BloodGroup = "B+",
            FoodInfo = "Veg",
            Role = "Guider",
            WorkType = "Full-time",
            Status = MemberStatus.Available
        };

        var staffAnita = new Member
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            MemberCode = "#S1",
            FullName = "Anita Krishnan",
            Email = "anita.staff@v4journey.com",
            MobileNo = "+91 9442892326",
            Age = 31,
            Gender = "Female",
            BloodGroup = "A+",
            FoodInfo = "Veg",
            Role = "Staff",
            WorkType = "Full-time",
            Status = MemberStatus.Available
        };

        context.Members.AddRange(driverRahul, helperShiva, guiderSuresh, staffAnita);

        // 6. Trips
        var trip1 = new Trip
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            TripCode = "#0001",
            Name = "Kochi to Munnar family trip",
            Description = "Experience the scenic misty tea hills of Munnar, serene backwaters, and lush Western Ghats with premium comfortable travel.",
            Category = "Family Trip",
            Origin = "Tirunelveli",
            Destination = "Munnar",
            Via = "Madurai - Theni",
            StartDateTime = UtcDate(2026, 9, 21, 10, 0, 0),
            EndDateTime = UtcDate(2026, 9, 26, 22, 0, 0),
            Duration = "5D 6N",
            TotalSeats = 40,
            BookedSeats = 35,
            FoodInfo = "With Food and Snacks",
            PickupDrop = "Available with extra charges",
            AdultPrice = 6500,
            AdultSpends = 4200,
            AdultMargin = 2300,
            ChildPrice = 5999,
            ChildSpends = 3900,
            ChildMargin = 2099,
            Status = TripStatus.Active,
            IsPublished = true,
            PublicSlug = "kochi-to-munnar-family-trip-0001",
            PublishedAt = UtcDate(2026, 8, 10),
            CreatedAt = UtcDate(2026, 8, 10),
            Schedules = new List<TripItinerarySchedule>
            {
                new() { Id = Guid.NewGuid(), TenantId = tenantId, DayNumber = 1, DayDate = UtcDate(2026, 9, 21), TimeString = "10:00 AM", Activity = "Started from Tirunelveli New bus stand", Location = "Tnvl Bus Stand" },
                new() { Id = Guid.NewGuid(), TenantId = tenantId, DayNumber = 1, DayDate = UtcDate(2026, 9, 21), TimeString = "04:30 PM", Activity = "Kochi Beach & Sunset viewpoint", Location = "Fort Kochi" },
                new() { Id = Guid.NewGuid(), TenantId = tenantId, DayNumber = 2, DayDate = UtcDate(2026, 9, 22), TimeString = "09:00 AM", Activity = "Alappuzha Houseboat cruise with traditional lunch", Location = "Alappuzha" },
                new() { Id = Guid.NewGuid(), TenantId = tenantId, DayNumber = 3, DayDate = UtcDate(2026, 9, 23), TimeString = "11:00 AM", Activity = "Arrival at Munnar hill resort & tea tasting", Location = "Munnar" },
                new() { Id = Guid.NewGuid(), TenantId = tenantId, DayNumber = 3, DayDate = UtcDate(2026, 9, 23), TimeString = "03:00 PM", Activity = "Munnar sightseeing & Mattupetty Dam", Location = "Mattupetty" },
                new() { Id = Guid.NewGuid(), TenantId = tenantId, DayNumber = 4, DayDate = UtcDate(2026, 9, 24), TimeString = "09:30 PM", Activity = "Return journey to Tirunelveli", Location = "Tirunelveli" }
            },
            Travellers = new List<TripMember>
            {
                new() { Id = Guid.NewGuid(), TenantId = tenantId, TravellerName = "Padmanabhan", AgeGender = "64 / Male", Contact = "9442892326", Type = "Main", PickupLocation = "KTC Nagar bus stand", DropLocation = "Vinayagar Kovil St", PaymentStatus = PaymentStatus.Paid, PaidAmount = 13000, BalanceAmount = 0, FoodInfo = "Non-Veg" },
                new() { Id = Guid.NewGuid(), TenantId = tenantId, TravellerName = "Sathya Priya", AgeGender = "24 / Female", Contact = "8300658968", Type = "Sub", PickupLocation = "-", DropLocation = "-", PaymentStatus = PaymentStatus.Paid, PaidAmount = 0, BalanceAmount = 0, FoodInfo = "Veg" }
            },
            TeamAssignments = new List<TripTeamAssignment>
            {
                new() { Id = Guid.NewGuid(), TenantId = tenantId, MemberId = driverRahul.Id, AssignedRole = "Driver" },
                new() { Id = Guid.NewGuid(), TenantId = tenantId, MemberId = helperShiva.Id, AssignedRole = "Helper" },
                new() { Id = Guid.NewGuid(), TenantId = tenantId, MemberId = guiderSuresh.Id, AssignedRole = "Trip Guider" }
            }
        };

        var trip2 = new Trip
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            TripCode = "#0002",
            Name = "Bali honeymoon special",
            Category = "Honeymoon",
            Origin = "Bangalore",
            Destination = "Bali",
            StartDateTime = UtcDate(2026, 10, 10),
            EndDateTime = UtcDate(2026, 10, 16),
            Duration = "6D 5N",
            TotalSeats = 30,
            BookedSeats = 22,
            AdultPrice = 45000,
            AdultMargin = 12000,
            Status = TripStatus.Upcoming,
            IsPublished = true,
            PublicSlug = "bali-honeymoon-special-0002"
        };

        var trip3 = new Trip
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            TripCode = "#0003",
            Name = "Kodaikanal misty hills gateway",
            Category = "Couple",
            Origin = "Chennai",
            Destination = "Kodaikanal",
            StartDateTime = UtcDate(2026, 11, 5),
            EndDateTime = UtcDate(2026, 11, 8),
            Duration = "3D 2N",
            TotalSeats = 25,
            BookedSeats = 5,
            AdultPrice = 8500,
            AdultMargin = 2500,
            Status = TripStatus.Draft
        };

        var trip4 = new Trip
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            TripCode = "#0004",
            Name = "Ooty botanical weekend retreat",
            Category = "Family Trip",
            Origin = "Coimbatore",
            Destination = "Ooty",
            StartDateTime = UtcDate(2026, 7, 10),
            EndDateTime = UtcDate(2026, 7, 14),
            Duration = "4D 3N",
            TotalSeats = 35,
            BookedSeats = 35,
            AdultPrice = 7200,
            AdultMargin = 2100,
            Status = TripStatus.Completed
        };

        // Tenant 2 isolated trip
        var tenant2Trip = new Trip
        {
            Id = Guid.NewGuid(),
            TenantId = secondaryTenantId,
            TripCode = "#SKY-01",
            Name = "SkyWay Goa Beach Fest",
            Category = "Adventure",
            Origin = "Mumbai",
            Destination = "Goa",
            StartDateTime = UtcDate(2026, 12, 1),
            EndDateTime = UtcDate(2026, 12, 5),
            Duration = "4D 3N",
            TotalSeats = 50,
            BookedSeats = 10,
            AdultPrice = 12000,
            Status = TripStatus.Active
        };

        context.Trips.AddRange(trip1, trip2, trip3, trip4, tenant2Trip);

        // 7. Member Payout Payments
        var payout1 = new Payment
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            MemberId = driverRahul.Id,
            MemberName = driverRahul.FullName,
            TripCode = "#0056",
            TripName = "Bali beach trip",
            DaysCount = "2D 1N",
            WorkingPeriod = "10 Nov 2026 - 12 Nov 2026",
            PaymentMode = PaymentMode.Online,
            Amount = 4500,
            Balance = 0,
            Status = PaymentStatus.Paid,
            PaymentDate = UtcDate(2026, 11, 12),
            ReceiptNumber = "REC-88401"
        };

        var payout2 = new Payment
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            MemberId = driverRahul.Id,
            MemberName = driverRahul.FullName,
            TripCode = "#H7",
            TripName = "Munnar honeymoon express",
            DaysCount = "3D 2N",
            WorkingPeriod = "22 Oct 2026 - 25 Oct 2026",
            PaymentMode = PaymentMode.Cash,
            Amount = 6000,
            Balance = 0,
            Status = PaymentStatus.Paid,
            PaymentDate = UtcDate(2026, 10, 25),
            ReceiptNumber = "REC-88319"
        };

        var payout3 = new Payment
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            MemberId = driverRahul.Id,
            MemberName = driverRahul.FullName,
            TripCode = "#G4",
            TripName = "Germany family special tour",
            DaysCount = "7D 6N",
            WorkingPeriod = "13 Sep 2026 - 20 Sep 2026",
            PaymentMode = PaymentMode.Online,
            Amount = 7000,
            Balance = 500,
            Status = PaymentStatus.Partial,
            PaymentDate = UtcDate(2026, 9, 20),
            ReceiptNumber = "REC-88102"
        };

        context.Payments.AddRange(payout1, payout2, payout3);

        // 8. Custom Field Definitions
        var cfPassport = new CustomFieldDefinition
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            TargetEntity = "Member",
            FieldKey = "passportExpiry",
            FieldLabel = "Passport Expiry",
            FieldType = "date",
            IsRequired = false,
            ShowInTable = true
        };

        var cfEmergency = new CustomFieldDefinition
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            TargetEntity = "Member",
            FieldKey = "emergencyContact",
            FieldLabel = "Emergency Contact",
            FieldType = "text",
            IsRequired = true,
            ShowInTable = false
        };

        context.CustomFieldDefinitions.AddRange(cfPassport, cfEmergency);

        // 9. Activity Logs
        var log1 = new ActivityLog
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UserId = adminUser.Id,
            UserName = "Venkatesh V",
            Action = "Create",
            EntityType = "Trip",
            EntityId = trip1.Id,
            Description = "Created trip Kochi to Munnar family trip (#0001)",
            Timestamp = DateTime.UtcNow.AddDays(-10)
        };

        var log2 = new ActivityLog
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UserId = managerUser.Id,
            UserName = "Punitha S",
            Action = "Publish",
            EntityType = "Trip",
            EntityId = trip1.Id,
            Description = "Published trip Kochi to Munnar family trip with slug kochi-to-munnar-family-trip-0001",
            Timestamp = DateTime.UtcNow.AddDays(-9)
        };

        var log3 = new ActivityLog
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UserId = managerUser.Id,
            UserName = "Punitha S",
            Action = "Assign",
            EntityType = "Member",
            EntityId = driverRahul.Id,
            Description = "Assigned driver L.K.Rahul Sharma to trip #0001",
            Timestamp = DateTime.UtcNow.AddDays(-8)
        };

        context.ActivityLogs.AddRange(log1, log2, log3);

        await context.SaveChangesAsync();
    }
}

