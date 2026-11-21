using TravelSaas.Api.Domain.Enums;

namespace TravelSaas.Api.DTOs;

public record ResourceDto(
    Guid Id,
    Guid ResourceTypeId,
    string ResourceTypeKey,
    string ResourceTypeName,
    string Code,
    string Name,
    string? IdentificationNo,
    string Ownership, // Own / Partner
    string? PartnerName,
    string? ContactNo,
    string? Address,
    string Status,
    string? PictureUrl,
    string? InsurancePeriod,
    string? CurrentTripName,
    string CustomValuesJson,
    DateTime CreatedAt
);

public record CreateResourceRequest(
    Guid ResourceTypeId,
    string? Code,
    string Name,
    string? IdentificationNo,
    string Ownership,
    string? PartnerName,
    string? ContactNo,
    string? Address,
    string Status,
    string? InsurancePeriod,
    string? CustomValuesJson
);

public record ResourceTypeDto(
    Guid Id,
    string Key,
    string DisplayName,
    string Icon,
    int DisplayOrder,
    bool IsSystem,
    List<ResourceFieldDto> Fields
);

public record ResourceFieldDto(
    Guid Id,
    string FieldKey,
    string Label,
    string DataType,
    bool IsRequired,
    bool ShowInTable,
    string? OptionsJson,
    int DisplayOrder
);

public record CreateResourceTypeRequest(
    string Key,
    string DisplayName,
    string Icon,
    List<CreateResourceFieldRequest> Fields
);

public record CreateResourceFieldRequest(
    string FieldKey,
    string Label,
    string DataType,
    bool IsRequired,
    bool ShowInTable,
    string? OptionsJson,
    int DisplayOrder
);

