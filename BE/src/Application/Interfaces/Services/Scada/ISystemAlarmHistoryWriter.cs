namespace Backend.Application.Interfaces.Services.Scada;

/// <summary>
/// Ghi sự kiện hệ thống (vòng đời API / lỗi API / Redis) vào <c>public.alarm_history</c>.
/// </summary>
public interface ISystemAlarmHistoryWriter
{
    /// <summary>
    /// Type = SYSTEM (EventTypeId=21) — backend khởi động hoặc dừng bình thường.
    /// </summary>
    Task WriteApiLifecycleAsync(string description, string? detail = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Type = SYSTEM (EventTypeId=22) — API không start / dừng bất thường / lỗi host.
    /// </summary>
    Task WriteApiErrorAsync(string description, string? detail = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Type = Communication (EventTypeId=23) — mất kết nối Redis / Redis timeout.
    /// </summary>
    Task WriteRedisErrorAsync(string description, string? detail = null, CancellationToken cancellationToken = default);
}
