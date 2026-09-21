namespace Backend.Application.DTOs.Scada;

public class StationOperatorDto
{
    public long Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public DateOnly? DateOfBirth { get; set; }
    public string? Position { get; set; }
    public string? EducationLevel { get; set; }
    public string? EmployeeCode { get; set; }
    public string? Phone { get; set; }
    /// <summary>Thời gian nhận ca (Redis) — khác LastLoginTime UserScada.</summary>
    public DateTimeOffset? ShiftStartTime { get; set; }
}

public class StationTeamDto
{
    public long StationId { get; set; }
    public string StationCode { get; set; } = string.Empty;
    public IReadOnlyList<StationOperatorDto> Operators { get; set; } = [];
}
