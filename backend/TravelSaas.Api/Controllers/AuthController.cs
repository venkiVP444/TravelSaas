using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using TravelSaas.Api.Data;
using TravelSaas.Api.DTOs;
using TravelSaas.Api.Services;

namespace TravelSaas.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAuthService _authService;
    private readonly ITenantService _tenantService;

    public AuthController(AppDbContext context, IAuthService authService, ITenantService tenantService)
    {
        _context = context;
        _authService = authService;
        _tenantService = tenantService;
    }

    [AllowAnonymous]
    [EnableRateLimiting("AuthPolicy")]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        // Ignore global tenant filter for login
        var user = await _context.Users.IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower() && u.IsActive);

        if (user == null || !_authService.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == user.TenantId);
        if (tenant == null || !tenant.IsActive)
        {
            return Unauthorized(new { message = "Tenant is deactivated or not found." });
        }

        var token = _authService.GenerateJwtToken(user);
        var userDto = new UserDto(user.Id, user.Email, user.FullName, user.Role);
        var tenantDto = new TenantDto(tenant.Id, tenant.Name, tenant.Slug, tenant.LogoUrl);

        return Ok(new LoginResponse(token, userDto, tenantDto));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<LoginResponse>> GetCurrentUser()
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        var user = await _context.Users.FirstOrDefaultAsync();
        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);

        if (user == null || tenant == null)
        {
            return Unauthorized();
        }

        var token = _authService.GenerateJwtToken(user);
        return Ok(new LoginResponse(token, new UserDto(user.Id, user.Email, user.FullName, user.Role), new TenantDto(tenant.Id, tenant.Name, tenant.Slug, tenant.LogoUrl)));
    }
}

