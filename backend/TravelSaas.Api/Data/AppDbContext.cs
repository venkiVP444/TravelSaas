using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using TravelSaas.Api.Domain.Entities;
using TravelSaas.Api.Services;

namespace TravelSaas.Api.Data;

public class AppDbContext : DbContext
{
    private readonly ITenantService _tenantService;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantService tenantService)
        : base(options)
    {
        _tenantService = tenantService;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Trip> Trips => Set<Trip>();
    public DbSet<TripItineraryDay> TripItineraryDays => Set<TripItineraryDay>();
    public DbSet<TripItinerarySchedule> TripItinerarySchedules => Set<TripItinerarySchedule>();
    public DbSet<TripMember> TripMembers => Set<TripMember>();
    public DbSet<TripTeamAssignment> TripTeamAssignments => Set<TripTeamAssignment>();
    public DbSet<Member> Members => Set<Member>();
    public DbSet<ResourceType> ResourceTypes => Set<ResourceType>();
    public DbSet<ResourceFieldDefinition> ResourceFieldDefinitions => Set<ResourceFieldDefinition>();
    public DbSet<Resource> Resources => Set<Resource>();
    public DbSet<TripResourceAssignment> TripResourceAssignments => Set<TripResourceAssignment>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<CustomFieldDefinition> CustomFieldDefinitions => Set<CustomFieldDefinition>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<ConfigItem> ConfigItems => Set<ConfigItem>();

    public Guid CurrentTenantId => _tenantService.GetCurrentTenantId();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Global Query Filters for Multi-Tenancy dynamically evaluated per request
        modelBuilder.Entity<User>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<Trip>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<TripItineraryDay>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<TripItinerarySchedule>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<TripMember>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<TripTeamAssignment>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<Member>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<ResourceType>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<ResourceFieldDefinition>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<Resource>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<TripResourceAssignment>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<Payment>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<CustomFieldDefinition>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<ActivityLog>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
        modelBuilder.Entity<ConfigItem>().HasQueryFilter(e => e.TenantId == CurrentTenantId);

        // Unique constraints & indexes
        modelBuilder.Entity<Tenant>()
            .HasIndex(t => t.Slug)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => new { u.TenantId, u.Email })
            .IsUnique();

        modelBuilder.Entity<Trip>()
            .HasIndex(t => new { t.TenantId, t.TripCode })
            .IsUnique();

        modelBuilder.Entity<Member>()
            .HasIndex(m => new { m.TenantId, m.MemberCode })
            .IsUnique();

        modelBuilder.Entity<Resource>()
            .HasIndex(r => new { r.TenantId, r.Code })
            .IsUnique();

        modelBuilder.Entity<ResourceType>()
            .HasIndex(rt => new { rt.TenantId, rt.Key })
            .IsUnique();

        modelBuilder.Entity<Trip>()
            .HasIndex(t => t.PublicSlug);

        // Entity Relationships and Cascades
        modelBuilder.Entity<Trip>()
            .HasMany(t => t.Days)
            .WithOne()
            .HasForeignKey(d => d.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TripItineraryDay>()
            .HasMany(d => d.Schedules)
            .WithOne()
            .HasForeignKey(s => s.DayId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Trip>()
            .HasMany(t => t.Schedules)
            .WithOne()
            .HasForeignKey(s => s.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Trip>()
            .HasMany(t => t.Travellers)
            .WithOne()
            .HasForeignKey(m => m.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Trip>()
            .HasMany(t => t.TeamAssignments)
            .WithOne()
            .HasForeignKey(a => a.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Trip>()
            .HasMany(t => t.ResourceAssignments)
            .WithOne()
            .HasForeignKey(a => a.TripId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ResourceType>()
            .HasMany(rt => rt.FieldDefinitions)
            .WithOne()
            .HasForeignKey(f => f.ResourceTypeId)
            .OnDelete(DeleteBehavior.Cascade);

        // UTC DateTime conversions for PostgreSQL & SQLite compliance
        var utcDateTimeConverter = new ValueConverter<DateTime, DateTime>(
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc),
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

        var nullableUtcDateTimeConverter = new ValueConverter<DateTime?, DateTime?>(
            v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v,
            v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                {
                    property.SetValueConverter(utcDateTimeConverter);
                }
                else if (property.ClrType == typeof(DateTime?))
                {
                    property.SetValueConverter(nullableUtcDateTimeConverter);
                }
                else if (property.ClrType == typeof(decimal) || property.ClrType == typeof(decimal?))
                {
                    property.SetPrecision(18);
                    property.SetScale(2);
                }
            }
        }

        modelBuilder.Entity<CustomFieldDefinition>()
            .HasIndex(c => new { c.TenantId, c.TargetEntity, c.FieldKey })
            .IsUnique();

        // PostgreSQL JSONB native column types
        if (Database.IsNpgsql())
        {
            modelBuilder.Entity<Trip>().Property(t => t.CustomFieldsJson).HasColumnType("jsonb");
            modelBuilder.Entity<TripMember>().Property(m => m.CustomFieldsJson).HasColumnType("jsonb");
            modelBuilder.Entity<Member>().Property(m => m.CustomFieldsJson).HasColumnType("jsonb");
            modelBuilder.Entity<Resource>().Property(r => r.CustomValuesJson).HasColumnType("jsonb");
            modelBuilder.Entity<ResourceFieldDefinition>().Property(f => f.OptionsJson).HasColumnType("jsonb");
            modelBuilder.Entity<CustomFieldDefinition>().Property(c => c.OptionsJson).HasColumnType("jsonb");
        }
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        foreach (var entry in ChangeTracker.Entries<ITenantScoped>())
        {
            if (entry.State == EntityState.Added && entry.Entity.TenantId == Guid.Empty)
            {
                entry.Entity.TenantId = tenantId;
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
