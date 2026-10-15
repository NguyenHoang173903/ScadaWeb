using Backend.Application.Interfaces.Services.Scada;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Realtime;

/// <summary>
/// Ghi <c>alarm_history</c> (SYSTEM) khi process API bị dừng đột ngột
/// (ProcessExit mà chưa qua StopAsync bình thường). Không ghi khi stop/graceful shutdown.
/// </summary>
public sealed class ApiAbruptStopAlarmHostedService(
    ISystemAlarmHistoryWriter alarms,
    ILogger<ApiAbruptStopAlarmHostedService> logger) : IHostedService
{
    private int _gracefulStop;
    private int _started;

    public Task StartAsync(CancellationToken cancellationToken)
    {
        Interlocked.Exchange(ref _started, 1);
        AppDomain.CurrentDomain.ProcessExit += OnProcessExit;
        logger.LogInformation("API abrupt-stop alarm watcher registered");
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        Interlocked.Exchange(ref _gracefulStop, 1);
        AppDomain.CurrentDomain.ProcessExit -= OnProcessExit;
        return Task.CompletedTask;
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
