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
public class MembersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;

    public MembersController(AppDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    [HttpGet]
    public async Task<ActionResult<List<MemberDto>>> GetMembers(
        [FromQuery] string? role,
        [FromQuery] string? search,
        [FromQuery] string? status)
    {
        var query = _context.Members
            .Include(m => m.TripAssignments)
            .Include(m => m.Payments)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(role) && role.ToLower() != "all")
        {
            query = query.Where(m => m.Role.ToLower() == role.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(status) && status.ToLower() != "all")
        {
            if (Enum.TryParse<MemberStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(m => m.Status == parsedStatus);
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(m => m.FullName.ToLower().Contains(s) ||
                                     m.MemberCode.ToLower().Contains(s) ||
                                     m.MobileNo.Contains(s) ||
                                     m.Role.ToLower().Contains(s));
        }

        var members = await query
            .OrderBy(m => m.MemberCode)
            .Select(m => new MemberDto(
                m.Id,
                m.MemberCode,
                m.FullName,
                m.Email,
                m.MobileNo,
                m.AadhaarNo,
                m.LicenseNo,
                m.DateOfBirth,
                m.Age,
                m.Gender,
                m.BloodGroup,
                m.FoodInfo,
                m.Role,
                m.WorkType,
                m.ContractPeriod,
                m.WorkJoinDate,
                m.WorkEndDate,
                m.SalaryPeriod,
                m.Address,
                m.PhotoUrl,
                m.DocumentUrl,
                m.Status.ToString(),
                m.CustomFieldsJson,
                m.TripAssignments.Count,
                m.Payments.Sum(p => p.Amount),
                m.Payments.Sum(p => p.Balance)
            ))
            .ToListAsync();

        return Ok(members);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MemberDto>> GetMemberById(Guid id)
    {
        var m = await _context.Members
            .Include(mem => mem.TripAssignments)
            .Include(mem => mem.Payments)
            .FirstOrDefaultAsync(mem => mem.Id == id);

        if (m == null)
        {
            return NotFound(new { message = "Member not found." });
        }

        return Ok(new MemberDto(
            m.Id,
            m.MemberCode,
            m.FullName,
            m.Email,
            m.MobileNo,
            m.AadhaarNo,
            m.LicenseNo,
            m.DateOfBirth,
            m.Age,
            m.Gender,
            m.BloodGroup,
            m.FoodInfo,
            m.Role,
            m.WorkType,
            m.ContractPeriod,
            m.WorkJoinDate,
            m.WorkEndDate,
            m.SalaryPeriod,
            m.Address,
            m.PhotoUrl,
            m.DocumentUrl,
            m.Status.ToString(),
            m.CustomFieldsJson,
            m.TripAssignments.Count,
            m.Payments.Sum(p => p.Amount),
            m.Payments.Sum(p => p.Balance)
        ));
    }

    [HttpPost]
    public async Task<ActionResult<MemberDto>> CreateMember([FromBody] CreateMemberRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(new { message = "Full Name is required." });
        }

        var tenantId = _tenantService.GetCurrentTenantId();

        var code = request.MemberCode;
        if (string.IsNullOrWhiteSpace(code))
        {
            var prefix = request.Role?.ToUpper().Substring(0, 1) ?? "M";
            var count = await _context.Members.CountAsync() + 1;
            code = $"#{prefix}{count}";
        }

        Enum.TryParse<MemberStatus>(request.Status, true, out var status);

        var member = new Member
        {
            TenantId = tenantId,
            MemberCode = code,
            FullName = request.FullName,
            Email = request.Email,
            MobileNo = request.MobileNo,
            AadhaarNo = request.AadhaarNo,
            LicenseNo = request.LicenseNo,
            DateOfBirth = request.DateOfBirth,
            Age = request.Age > 0 ? request.Age : 28,
            Gender = request.Gender ?? "Male",
            BloodGroup = request.BloodGroup ?? "O+",
            FoodInfo = request.FoodInfo ?? "Non-Veg",
            Role = request.Role ?? "Driver",
            WorkType = request.WorkType ?? "Full-time (Contract)",
            ContractPeriod = request.ContractPeriod ?? "2 years",
            WorkJoinDate = request.WorkJoinDate != default ? request.WorkJoinDate : DateTime.UtcNow,
            WorkEndDate = request.WorkEndDate,
            SalaryPeriod = request.SalaryPeriod ?? "Weekly",
            Address = request.Address,
            PhotoUrl = request.PhotoUrl,
            DocumentUrl = request.DocumentUrl,
            Status = status,
            CustomFieldsJson = request.CustomFieldsJson ?? "{}"
        };

        _context.Members.Add(member);

        _context.ActivityLogs.Add(new ActivityLog
        {
            TenantId = tenantId,
            UserName = "Current User",
            Action = "Create",
            EntityType = "Member",
            EntityId = member.Id,
            Description = $"Added team member {member.FullName} ({member.MemberCode})",
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        var detailRes = await GetMemberById(member.Id);
        var detail = (detailRes.Result as OkObjectResult)?.Value ?? detailRes.Value;
        return CreatedAtAction(nameof(GetMemberById), new { id = member.Id }, detail);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateMember(Guid id, [FromBody] CreateMemberRequest request)
    {
        var member = await _context.Members.FirstOrDefaultAsync(m => m.Id == id);
        if (member == null)
        {
            return NotFound(new { message = "Member not found." });
        }

        Enum.TryParse<MemberStatus>(request.Status, true, out var status);

        member.FullName = request.FullName;
        member.Email = request.Email;
        member.MobileNo = request.MobileNo;
        member.AadhaarNo = request.AadhaarNo;
        member.LicenseNo = request.LicenseNo;
        member.DateOfBirth = request.DateOfBirth;
        member.Age = request.Age;
        member.Gender = request.Gender;
        member.BloodGroup = request.BloodGroup;
        member.FoodInfo = request.FoodInfo;
        member.Role = request.Role;
        member.WorkType = request.WorkType;
        member.ContractPeriod = request.ContractPeriod;
        member.SalaryPeriod = request.SalaryPeriod;
        member.Address = request.Address;
        member.Status = status;
        if (!string.IsNullOrWhiteSpace(request.PhotoUrl)) member.PhotoUrl = request.PhotoUrl;
        if (!string.IsNullOrWhiteSpace(request.DocumentUrl)) member.DocumentUrl = request.DocumentUrl;
        if (!string.IsNullOrWhiteSpace(request.CustomFieldsJson)) member.CustomFieldsJson = request.CustomFieldsJson;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Member updated successfully." });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteMember(Guid id)
    {
        var member = await _context.Members.FirstOrDefaultAsync(m => m.Id == id);
        if (member == null)
        {
            return NotFound(new { message = "Member not found." });
        }

        member.Status = MemberStatus.ExWorker;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Member marked as Ex-Worker." });
    }
}
