using Backend.Application.Interfaces.Services.Scada;
using Backend.Application.Options;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Backend.Infrastructure.Realtime;

/// <summary>
/// Ghi <c>alarm_history</c> khi Redis đang kết nối rồi bị cắt đột ngột (ConnectionFailed).
/// Không ghi khi reconnect thành công hoặc khi API đang shutdown bình thường.
/// </summary>
public sealed class RedisConnectionAlarmHostedService(
    IStationRealtimeMultiplexer multiplexer,
    ISystemAlarmHistoryWriter alarms,
    IOptions<RealtimeOptions> options,
    ILogger<RedisConnectionAlarmHostedService> logger) : IHostedService
{
    private int _down;
    private int _wasConnected;
    private int _shuttingDown;

    public Task StartAsync(CancellationToken cancellationToken)
    {
        if (!string.Equals(options.Value.Provider, "StationSnapshot", StringComparison.OrdinalIgnoreCase))
            return Task.CompletedTask;

        var connection = multiplexer.Connection;
        if (connection.IsConnected)
            Interlocked.Exchange(ref _wasConnected, 1);

        connection.ConnectionFailed += OnConnectionFailed;
        connection.ConnectionRestored += OnConnectionRestored;
        logger.LogInformation("Redis connection alarm watcher registered");
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        Interlocked.Exchange(ref _shuttingDown, 1);

        var connection = multiplexer.Connection;
        connection.ConnectionFailed -= OnConnectionFailed;
        connection.ConnectionRestored -= OnConnectionRestored;
        return Task.CompletedTask;
    }

    private void OnConnectionFailed(object? sender, ConnectionFailedEventArgs e)
    {
        if (Volatile.Read(ref _shuttingDown) == 1)
            return;

        // Chỉ lần đầu chuyển sang down — tránh spam.
        if (Interlocked.Exchange(ref _down, 1) == 1)
            return;

        var wasConnected = Volatile.Read(ref _wasConnected) == 1;
        var description = wasConnected
            ? "Kết nối Redis bị dừng đột ngột"
            : "Mất kết nối Redis";
        var detail = $"{e.FailureType}: {e.Exception?.Message ?? e.ToString()}";
        _ = alarms.WriteRedisErrorAsync(description, detail);
    }

    private void OnConnectionRestored(object? sender, ConnectionFailedEventArgs e)
    {
        Interlocked.Exchange(ref _wasConnected, 1);
        Interlocked.Exchange(ref _down, 0);
        // Không ghi alarm khi khôi phục.
    }
}
