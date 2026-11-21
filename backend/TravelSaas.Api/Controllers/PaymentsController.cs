using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelSaas.Api.Data;
using TravelSaas.Api.Domain.Entities;
using TravelSaas.Api.Domain.Enums;
using TravelSaas.Api.DTOs;
using TravelSaas.Api.Services;

namespace TravelSaas.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;

    public PaymentsController(AppDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    [HttpGet]
    public async Task<ActionResult<List<PaymentDto>>> GetPayments([FromQuery] Guid? memberId, [FromQuery] Guid? tripId)
    {
        var query = _context.Payments.AsQueryable();

        if (memberId.HasValue)
        {
            query = query.Where(p => p.MemberId == memberId.Value);
        }

        if (tripId.HasValue)
        {
            query = query.Where(p => p.TripId == tripId.Value);
        }

        var list = await query
            .OrderByDescending(p => p.PaymentDate)
            .Select(p => new PaymentDto(
                p.Id,
                p.TripId,
                p.TripCode,
                p.TripName,
                p.MemberId,
                p.MemberName,
                p.Amount,
                p.Balance,
                p.PaymentMode.ToString(),
                p.Status.ToString(),
                p.PaymentDate,
                p.WorkingPeriod,
                p.DaysCount,
                p.ReceiptNumber,
                p.Notes
            ))
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<PaymentDto>> CreatePayment([FromBody] CreatePaymentRequest request)
    {
        var tenantId = _tenantService.GetCurrentTenantId();
        Enum.TryParse<PaymentMode>(request.PaymentMode, true, out var mode);
        Enum.TryParse<PaymentStatus>(request.Status, true, out var status);

        var count = await _context.Payments.CountAsync() + 1;
        var receipt = $"REC-{DateTime.UtcNow.Year}{count:D4}";

        var payment = new Payment
        {
            TenantId = tenantId,
            TripId = request.TripId,
            TripCode = request.TripCode,
            TripName = request.TripName,
            MemberId = request.MemberId,
            MemberName = request.MemberName,
            Amount = request.Amount,
            Balance = request.Balance,
            PaymentMode = mode,
            Status = status,
            PaymentDate = request.PaymentDate != default ? request.PaymentDate : DateTime.UtcNow,
            WorkingPeriod = request.WorkingPeriod,
            DaysCount = request.DaysCount,
            ReceiptNumber = receipt,
            Notes = request.Notes
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        return Ok(new PaymentDto(
            payment.Id,
            payment.TripId,
            payment.TripCode,
            payment.TripName,
            payment.MemberId,
            payment.MemberName,
            payment.Amount,
            payment.Balance,
            payment.PaymentMode.ToString(),
            payment.Status.ToString(),
            payment.PaymentDate,
            payment.WorkingPeriod,
            payment.DaysCount,
            payment.ReceiptNumber,
            payment.Notes
        ));
    }
}

