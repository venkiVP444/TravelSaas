namespace TravelSaas.Api.DTOs;

public record PaymentDto(
    Guid Id,
    Guid? TripId,
    string? TripCode,
    string? TripName,
    Guid? MemberId,
    string? MemberName,
    decimal Amount,
    decimal Balance,
    string PaymentMode,
    string Status,
    DateTime PaymentDate,
    string? WorkingPeriod,
    string? DaysCount,
    string? ReceiptNumber,
    string? Notes
);

public record CreatePaymentRequest(
    Guid? TripId,
    string? TripCode,
    string? TripName,
    Guid? MemberId,
    string? MemberName,
    decimal Amount,
    decimal Balance,
    string PaymentMode,
    string Status,
    DateTime PaymentDate,
    string? WorkingPeriod,
    string? DaysCount,
    string? Notes
);

