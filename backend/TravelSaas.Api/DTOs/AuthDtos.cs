namespace TravelSaas.Api.DTOs;

public record LoginRequest(string Email, string Password);
public record LoginResponse(string Token, UserDto User, TenantDto Tenant);
public record UserDto(Guid Id, string Email, string FullName, string Role);
public record TenantDto(Guid Id, string Name, string Slug, string? LogoUrl);

