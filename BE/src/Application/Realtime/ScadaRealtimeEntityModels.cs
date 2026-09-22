namespace Backend.Application.Realtime;

/// <summary>
/// JSON alarm/lỗi trên Redis — key <c>SCADA:{stationCode}:ALARM:{id}</c>.
/// </summary>
public sealed class RealtimeAlarmRedisModel
{
    public long Id { get; set; }
    public DateTimeOffset? StartTime { get; set; }
    public DateTimeOffset? EndTime { get; set; }
    public string? DeviceName { get; set; }
    public string? TagName { get; set; }
    public long? TagId { get; set; }
    public long? DeviceId { get; set; }
    public string? Type { get; set; }
    public long? TagEventConfigId { get; set; }
    public long? EventTypeId { get; set; }
    public string? Description { get; set; }
    public string? TroubleshootingGuide { get; set; }
    public string? State { get; set; }
    public string? Severity { get; set; }
    public double? Value { get; set; }
    public bool Acknowledged { get; set; }
    public string? AcknowledgedBy { get; set; }
    public DateTimeOffset? AcknowledgedAt { get; set; }
}

/// <summary>
/// JSON tổ vận hành trên Redis — key <c>SCADA:{stationCode}:OPERATOR:{id}</c>.
/// Không lẫn với <c>LastLoginTime</c> của UserScada.
/// </summary>
public sealed class RealtimeOperatorRedisModel
{
    public long ID { get; set; }
    public string? HoTen { get; set; }
    public DateOnly? NgaySinh { get; set; }
    public string? ChucVu { get; set; }
    public string? TrinhDo { get; set; }
    public string? MaNhanVien { get; set; }
    public string? DienThoai { get; set; }
    public DateTimeOffset? ThoiGianNhanCa { get; set; }
}
