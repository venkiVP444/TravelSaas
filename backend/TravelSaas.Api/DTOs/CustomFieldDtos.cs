namespace TravelSaas.Api.DTOs;

public record CustomFieldDto(
    Guid Id,
    string TargetEntity,
    string FieldKey,
    string FieldLabel,
    string FieldType,
    bool IsRequired,
    bool ShowInTable,
    string? OptionsJson
);

public record CreateCustomFieldRequest(
    string TargetEntity,
    string FieldKey,
    string FieldLabel,
    string FieldType,
    bool IsRequired,
    bool ShowInTable,
    string? OptionsJson
);

