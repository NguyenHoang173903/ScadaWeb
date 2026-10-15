namespace Backend.Application.Interfaces.Services.Scada;

/// <summary>
/// Ghi sự cố hệ thống (API / Redis) vào <c>public.alarm_history</c>.
/// Chỉ gọi khi có lỗi — không ghi start/stop bình thường.
/// </summary>
public interface ISystemAlarmHistoryWriter
{
    /// <summary>
    /// Type = SYSTEM (EventTypeId=22) — API không start / dừng bất thường / lỗi host.
    /// </summary>
    Task WriteApiErrorAsync(string description, string? detail = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Type = Communication (EventTypeId=23) — mất kết nối Redis / Redis timeout.
    /// </summary>
    Task WriteRedisErrorAsync(string description, string? detail = null, CancellationToken cancellationToken = default);
}
