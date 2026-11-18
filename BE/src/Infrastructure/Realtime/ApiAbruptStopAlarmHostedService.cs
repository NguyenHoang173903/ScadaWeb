using Backend.Application.Interfaces.Services.Scada;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Realtime;

/// <summary>
/// Ghi sự kiện vòng đời backend vào <c>alarm_history</c> và ghi thêm lỗi nếu
/// process thoát bất thường trước khi host gọi StopAsync.
/// </summary>
public sealed class ApiAbruptStopAlarmHostedService(
    ISystemAlarmHistoryWriter alarms,
    ILogger<ApiAbruptStopAlarmHostedService> logger) : IHostedService
{
    private int _gracefulStop;
    private int _started;

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        Interlocked.Exchange(ref _started, 1);
        AppDomain.CurrentDomain.ProcessExit += OnProcessExit;
        logger.LogInformation("API lifecycle and abrupt-stop alarm watcher registered");
        await alarms.WriteApiLifecycleAsync(
            "Backend.Api khởi động",
            cancellationToken: cancellationToken);
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        Interlocked.Exchange(ref _gracefulStop, 1);
        AppDomain.CurrentDomain.ProcessExit -= OnProcessExit;
        await alarms.WriteApiLifecycleAsync(
            "Backend.Api dừng bình thường",
            cancellationToken: cancellationToken);
    }

    private void OnProcessExit(object? sender, EventArgs e)
    {
        if (Volatile.Read(ref _started) == 0)
            return;

        // Đã StopAsync → shutdown bình thường, không lưu.
        if (Interlocked.Exchange(ref _gracefulStop, 1) == 1)
            return;

        try
        {
            alarms.WriteApiErrorAsync(
                    "Backend.Api bị dừng đột ngột trong khi đang chạy",
                    "ProcessExit trước khi host StopAsync")
                .ConfigureAwait(false)
                .GetAwaiter()
                .GetResult();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not write abrupt API stop to alarm_history");
        }
    }
}
