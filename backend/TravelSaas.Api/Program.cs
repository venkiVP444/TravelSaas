using System.Text;
using System.Text.Json;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using TravelSaas.Api.Data;
using TravelSaas.Api.Middleware;
using TravelSaas.Api.Services;
using TravelSaas.Api.Services.Storage;

var builder = WebApplication.CreateBuilder(args);

// 1. Core Services & Proxy Forwarding
builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();
builder.Services.AddOpenApi();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

// 2. Storage Services
var storageProvider = builder.Configuration["Storage:Provider"] ?? "Local";
if (storageProvider.Equals("S3", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddSingleton<IBlobStorageService, S3CompatibleBlobStorageService>();
}
else
{
    builder.Services.AddSingleton<IBlobStorageService, LocalBlobStorageService>();
}
builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();

// 3. Domain Services
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// 4. Database Configuration: PostgreSQL (Production / Dev default) with SQLite fallback
var dbProvider = builder.Configuration["DatabaseProvider"] ?? "PostgreSQL";
var defaultConnString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (dbProvider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
    {
        var sqliteConn = defaultConnString ?? "Data Source=travelsaas.db";
        options.UseSqlite(sqliteConn);
    }
    else
    {
        var pgConn = defaultConnString ?? "Host=127.0.0.1;Port=5433;Database=travelsaas_dev;Username=postgres;Password=;Pooling=true;MinPoolSize=5;MaxPoolSize=100;";
        options.UseNpgsql(pgConn, npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
            npgsqlOptions.CommandTimeout(30);
        });
    }
});

// 5. Database Health Checks
builder.Services.AddHealthChecks();

// 6. Rate Limiting for Authentication Protection
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("AuthPolicy", opt =>
    {
        opt.PermitLimit = 15;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
});

// 7. JWT Authentication & Strict Production Validation
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "V4Journey_Super_Secret_Key_Production_Ready_2026_Minimum_32_Chars";
if (builder.Environment.IsProduction() && (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Contains("Super_Secret_Key")))
{
    throw new InvalidOperationException("CRITICAL SECURITY ERROR: Production JWT Secret must be provided via environment variable (Jwt__Secret) and cannot use development default.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = builder.Environment.IsProduction();
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "V4JourneyApi",
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "V4JourneyClient",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// 8. CORS Configuration
var allowedOriginsConfig = builder.Configuration["Cors:AllowedOrigins"];
builder.Services.AddCors(options =>
{
    options.AddPolicy("AppCors", policy =>
    {
        if (builder.Environment.IsDevelopment() || string.IsNullOrWhiteSpace(allowedOriginsConfig) || allowedOriginsConfig == "*")
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            var origins = allowedOriginsConfig.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            policy.WithOrigins(origins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

var app = builder.Build();

// 9. Pipeline Middleware Ordering
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
app.UseForwardedHeaders();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();

if (app.Environment.IsProduction())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseRouting();
app.UseCors("AppCors");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// 10. Static Uploads File Serving
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

// 11. Optional SPA Static Hosting and Routing Fallback (for single-origin deployments)
var wwwroot = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
if (Directory.Exists(wwwroot))
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
    app.MapFallbackToFile("index.html");
}

app.MapControllers();

// 12. Health Checks Endpoints (Zero Sensitive Leakage)
app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    product = "TravelSaas / V4Journey",
    version = "1.0.0",
    databaseProvider = builder.Configuration["DatabaseProvider"] ?? "PostgreSQL",
    environment = app.Environment.EnvironmentName,
    timestamp = DateTime.UtcNow
})).AllowAnonymous();

app.MapGet("/health/ready", async (AppDbContext db) =>
{
    var canConnect = await db.Database.CanConnectAsync();
    var result = new
    {
        status = canConnect ? "Healthy" : "Unhealthy",
        provider = db.Database.ProviderName,
        databaseCanConnect = canConnect,
        timestamp = DateTime.UtcNow
    };
    return canConnect ? Results.Ok(result) : Results.Problem(title: "Database connection unavailable", statusCode: 503);
}).AllowAnonymous();

// 13. Database Schema and Initial Seed Execution
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        logger.LogInformation("Ensuring database schema using provider: {Provider}", context.Database.ProviderName);
        if (context.Database.IsNpgsql())
        {
            await context.Database.MigrateAsync();
        }
        else
        {
            await context.Database.EnsureCreatedAsync();
        }

        // Demo seed accounts isolation: only run in Development or when SeedDemoData=true
        var seedDemoData = builder.Configuration.GetValue<bool>("SeedDemoData") || app.Environment.IsDevelopment();
        if (seedDemoData)
        {
            await DbInitializer.SeedAsync(context, authService);
            logger.LogInformation("Demo seed data initialized for development environment.");
        }
        else
        {
            logger.LogInformation("Production environment active: Demo seed accounts omitted to protect production data.");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database schema migration or initialization failed.");
        throw;
    }
}

app.Run();

public partial class Program { }
