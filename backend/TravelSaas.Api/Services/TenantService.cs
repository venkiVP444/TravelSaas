namespace TravelSaas.Api.Services;

public interface ITenantService
{
    Guid GetCurrentTenantId();
    void SetCurrentTenantId(Guid tenantId);
}

public class TenantService : ITenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private Guid? _overriddenTenantId;

    public TenantService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid GetCurrentTenantId()
    {
        if (_overriddenTenantId.HasValue)
        {
            return _overriddenTenantId.Value;
        }

        var context = _httpContextAccessor.HttpContext;
        if (context == null)
        {
            return Constants.DefaultTenantId;
        }

        // 1. Authenticated user: tenant is bound strictly to JWT claim
        var claim = context.User.FindFirst("TenantId");
        if (claim != null && Guid.TryParse(claim.Value, out var tenantIdFromClaim))
        {
            // Allow X-Tenant-Id override ONLY for platform SuperAdmins
            if (context.Request.Headers.TryGetValue("X-Tenant-Id", out var headerVal) &&
                Guid.TryParse(headerVal.FirstOrDefault(), out var requestedTenantId))
            {
                if (context.User.IsInRole("SuperAdmin") || context.User.IsInRole("PlatformAdmin"))
                {
                    return requestedTenantId;
                }
            }

            // Normal authenticated users can NEVER access another tenant
            return tenantIdFromClaim;
        }

        // 2. Unauthenticated requests (e.g. initial dev/seed or public tenant landing)
        if (context.Request.Headers.TryGetValue("X-Tenant-Id", out var publicHeaderVal) &&
            Guid.TryParse(publicHeaderVal.FirstOrDefault(), out var tenantIdFromHeader))
        {
            return tenantIdFromHeader;
        }

        return Constants.DefaultTenantId;
    }

    public void SetCurrentTenantId(Guid tenantId)
    {
        _overriddenTenantId = tenantId;
    }
}

public static class Constants
{
    public static readonly Guid DefaultTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid SecondaryTenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");
}
