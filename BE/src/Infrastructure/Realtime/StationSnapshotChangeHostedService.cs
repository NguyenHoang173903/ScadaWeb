using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using Backend.Application.Options;
using Backend.Application.Realtime;
using Backend.Application.Scada;
using Backend.Domain.Enums;
using Backend.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Backend.Infrastructure.Realtime;

/// <summary>
/// PLC writes <c>scada:station:{code}</c> without SignalR. This watcher polls Redis and
/// publishes <c>TagChanged</c> so FE screens (nguyên lý / công nghệ / thiết bị / …) refetch.
/// </summary>
public sealed class StationSnapshotChangeHostedService(
    IServiceScopeFactory scopeFactory,
    IStationRealtimeMultiplexer multiplexer,
    ITagStationCodeLookup tagStationLookup,
    IScadaRealtimeBroadcaster broadcaster,
    IOptions<RealtimeOptions> options,
    ILogger<StationSnapshotChangeHostedService> logger) : BackgroundService
{
    private static readonly string[] ScreenSlugs =
    [
        ScadaScreenMapping.ToSlug(ScadaScreenType.NguyenLy),
        ScadaScreenMapping.ToSlug(ScadaScreenType.CongNghe),
        ScadaScreenMapping.ToSlug(ScadaScreenType.ChiTietBom),
        ScadaScreenMapping.ToSlug(ScadaScreenType.Loi),
        ScadaScreenMapping.ToSlug(ScadaScreenType.Trend),
    ];

    private readonly ConcurrentDictionary<string, string> _lastHash =
        new(StringComparer.OrdinalIgnoreCase);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var cfg = options.Value;
        if (!string.Equals(cfg.Provider, "StationSnapshot", StringComparison.OrdinalIgnoreCase))
            return;

        var delay = TimeSpan.FromSeconds(Math.Clamp(cfg.SnapshotWatchIntervalSeconds, 1, 30));
        logger.LogInformation(
            "Station snapshot Redis watcher started. Interval={IntervalSeconds}s",
            delay.TotalSeconds);

        // Let the host finish wiring SignalR / DB before first poll.
        await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await TickAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Station snapshot Redis watch tick failed");
            }

            await Task.Delay(delay, stoppingToken);
        }
    }

    private async Task TickAsync(CancellationToken cancellationToken)
    {
        var codes = await tagStationLookup.GetAllActiveStationCodesAsync(cancellationToken);
        if (codes.Count == 0)
            return;

        var prefix = options.Value.StationKeyPrefix?.Trim().TrimEnd(':') ?? "scada:station";
        var keys = codes.Select(c => (RedisKey)StationSnapshotRealtimeDataStore.BuildStationKey(prefix, c)).ToArray();
        RedisValue[] values;
        try
        {
            values = await multiplexer.Connection.GetDatabase().StringGetAsync(keys);
        }
        catch (RedisException ex)
        {
            logger.LogWarning(ex, "Redis unavailable in station snapshot watcher");
            return;
        }

        Dictionary<string, long> stationIdByCode;
        using (var scope = scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            stationIdByCode = await db.Stations.AsNoTracking()
                .Where(s => s.IsActive)
                .Select(s => new { s.Id, s.Code })
                .ToDictionaryAsync(
                    x => x.Code.Trim(),
                    x => x.Id,
                    StringComparer.OrdinalIgnoreCase,
                    cancellationToken);
        }

        for (var i = 0; i < codes.Count; i++)
        {
            var code = codes[i];
            if (values[i].IsNullOrEmpty)
            {
                _lastHash.TryRemove(code, out _);
                continue;
            }

            var json = (string)values[i]!;
            var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(json)));
            if (_lastHash.TryGetValue(code, out var previous))
            {
                if (string.Equals(previous, hash, StringComparison.Ordinal))
                    continue;
            }
            else
            {
                // Baseline — do not storm clients on process start.
                _lastHash[code] = hash;
                continue;
            }

            _lastHash[code] = hash;
            if (!stationIdByCode.TryGetValue(code, out var stationId))
                continue;

            var groups = ScreenSlugs
                .Select(slug => ScadaRealtimeGroups.StationScreen(stationId, slug))
                .ToArray();

            await broadcaster.PublishAsync(
                new RealtimeChangedMessage
                {
                    TagId = 0,
                    DeviceId = 0,
                    StationId = stationId,
                    TagCode = "station.snapshot",
                    TagName = code,
                    Value = null,
                    DataType = "StationSnapshot",
                    Quality = TagQualityNames.Good,
                    Timestamp = DateTimeOffset.UtcNow
                },
                groups,
                cancellationToken);

            logger.LogDebug(
                "Station snapshot changed → TagChanged. Station={Station} Id={StationId}",
                code,
                stationId);
        }
    }
}
