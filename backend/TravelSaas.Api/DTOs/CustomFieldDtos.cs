namespace TravelSaas.Api.DTOs;

public record CustomFieldDto(
    Guid Id,
    string TargetEntity,
    string FieldKey,
    string FieldLabel,
    string FieldType,
    bool IsRequired,
    bool ShowInTable,
    string? OptionsJson,
    string? DefaultValue,
    int SortOrder,
    bool IsArchived,
    string? ValidationRulesJson
);

public record CreateCustomFieldRequest(
    string? TargetEntity,
    string? FieldKey,
    string? FieldLabel,
    string? Label,
    string? FieldType,
    string? DataType,
    bool IsRequired,
    bool ShowInTable,
    string? OptionsJson,
    string? DefaultValue,
    int? SortOrder,
    string? ValidationRulesJson
);

public record UpdateCustomFieldRequest(
    string FieldLabel,
    string? FieldType,
    bool IsRequired,
    bool ShowInTable,
    string? OptionsJson,
    string? DefaultValue,
    int? SortOrder,
    bool? IsArchived,
    string? ValidationRulesJson
);

public record ReorderCustomFieldsRequest(
    List<Guid> FieldIds
);
