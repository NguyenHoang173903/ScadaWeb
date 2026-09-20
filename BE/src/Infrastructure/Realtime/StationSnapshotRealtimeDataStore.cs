using System.Collections.Concurrent;
using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;
using Backend.Application.Options;
using Backend.Application.Realtime;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Backend.Infrastructure.Realtime;

/// <summary>
/// Reads PLC-produced station snapshots from Redis:
/// key <c>{StationKeyPrefix}:{stationCode}</c>, JSON string value.
/// Does not write (producer owns the key / TTL).
/// </summary>
public sealed class StationSnapshotRealtimeDataStore(
    IConnectionMultiplexer redis,
    ITagStationCodeLookup tagStationLookup,
    IOptions<RealtimeOptions> options,
    ILogger<StationSnapshotRealtimeDataStore> logger) : IRealtimeDataStore
{
    /// <summary>
    /// PLC writer uses PascalCase. Avoid camelCase naming policy (breaks acronyms like PLCs).
    /// </summary>
    internal static readonly JsonSerializerOptions SnapshotJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        NumberHandling = JsonNumberHandling.AllowReadingFromString
    };

    /// <summary>Short in-process cache — PLC TTL ~10s; avoids re-deserializing ~140KB on every REST hit.</summary>
    private static readonly TimeSpan SnapshotCacheTtl = TimeSpan.FromSeconds(1.5);
    private readonly ConcurrentDictionary<string, CachedSnapshot> _snapshotCache =
        new(StringComparer.OrdinalIgnoreCase);

    public async Task<RealtimeValue?> GetAsync(long tagId, CancellationToken cancellationToken = default)
    {
        var map = await GetManyAsync([tagId], cancellationToken);
        return map.TryGetValue(tagId, out var value) ? value : null;
    }

    public async Task<IReadOnlyDictionary<long, RealtimeValue>> GetManyAsync(
        IReadOnlyCollection<long> tagIds,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var ids = tagIds.Distinct().ToArray();
        if (ids.Length == 0)
            return new Dictionary<long, RealtimeValue>();

        var sw = Stopwatch.StartNew();
        var stationByTag = await tagStationLookup.GetStationCodesByTagIdsAsync(ids, cancellationToken);
        var stationCodes = stationByTag.Values
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (stationCodes.Length == 0)
        {
            logger.LogDebug(
                "Station snapshot lookup: no station codes for {TagCount} tagIds",
                ids.Length);
            return new Dictionary<long, RealtimeValue>();
        }

        var prefix = options.Value.StationKeyPrefix?.Trim().TrimEnd(':') ?? "scada:station";
        var now = DateTimeOffset.UtcNow;
        var byTagId = new Dictionary<long, RealtimeValue>();
        var wanted = ids.ToHashSet();
        var missingCodes = new List<string>();

        foreach (var stationCode in stationCodes)
        {
            if (_snapshotCache.TryGetValue(stationCode, out var cached)
                && now - cached.LoadedAt < SnapshotCacheTtl)
            {
                StationRealtimeSnapshotMapper.FlattenInto(cached.Model, wanted, byTagId);
            }
            else
            {
                missingCodes.Add(stationCode);
            }
        }

        if (missingCodes.Count > 0)
        {
            var keys = missingCodes.Select(code => (RedisKey)BuildStationKey(prefix, code)).ToArray();
            RedisValue[] rawValues;
            try
            {
                rawValues = await redis.GetDatabase().StringGetAsync(keys);
            }
            catch (RedisException ex)
            {
                logger.LogError(
                    ex,
                    "Redis unavailable while reading station snapshots. Stations={Stations} DurationMs={DurationMs}",
                    string.Join(',', missingCodes),
                    sw.ElapsedMilliseconds);
                throw;
            }

            for (var i = 0; i < missingCodes.Count; i++)
            {
                var stationCode = missingCodes[i];
                if (rawValues[i].IsNullOrEmpty)
                {
                    _snapshotCache.TryRemove(stationCode, out _);
                    logger.LogDebug(
                        "Redis station key missing. Station={Station} Key={Key}",
                        stationCode,
                        BuildStationKey(prefix, stationCode));
                    continue;
                }

                var json = (string)rawValues[i]!;
                StationRealtimeSnapshotRedisModel? snapshot;
                try
                {
                    snapshot = JsonSerializer.Deserialize<StationRealtimeSnapshotRedisModel>(
                        json,
                        SnapshotJsonOptions);
                }
                catch (JsonException ex)
                {
                    logger.LogWarning(
                        ex,
                        "Invalid Redis station payload. Station={Station} Length={Length}",
                        stationCode,
                        json.Length);
                    continue;
                }

                if (snapshot is null)
                    continue;

                _snapshotCache[stationCode] = new CachedSnapshot(snapshot, now);
                StationRealtimeSnapshotMapper.FlattenInto(snapshot, wanted, byTagId);
            }
        }

        logger.LogDebug(
            "Station snapshot read done. Stations={StationCount} CacheMiss={CacheMiss} RequestedTags={TagCount} HitTags={HitCount} DurationMs={DurationMs}",
            stationCodes.Length,
            missingCodes.Count,
            ids.Length,
            byTagId.Count,
            sw.ElapsedMilliseconds);

        return byTagId;
    }

    public Task SetAsync(long tagId, RealtimeValue value, CancellationToken cancellationToken = default)
    {
        logger.LogDebug(
            "Ignoring SetAsync for TagId={TagId} — station snapshot store is read-only",
            tagId);
        return Task.CompletedTask;
    }

    public static string BuildStationKey(string prefix, string stationCode) =>
        $"{prefix}:{stationCode.Trim()}";

    private sealed record CachedSnapshot(StationRealtimeSnapshotRedisModel Model, DateTimeOffset LoadedAt);
}
