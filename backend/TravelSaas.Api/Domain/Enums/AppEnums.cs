namespace TravelSaas.Api.Domain.Enums;

public enum TripStatus
{
    Draft,
    Upcoming,
    Active,
    Completed,
    Canceled,
    Archived
}

public enum OwnershipType
{
    Own,
    Partner
}

public enum ResourceStatus
{
    Available,
    InTrip,
    Maintenance,
    None
}

public enum MemberStatus
{
    Available,
    InTrip,
    OnLeave,
    OnCall,
    ExWorker
}

public enum PaymentStatus
{
    Pending,
    Partial,
    Paid,
    Refunded
}

public enum PaymentMode
{
    Online,
    Cash,
    UPI,
    BankTransfer,
    Card
}

