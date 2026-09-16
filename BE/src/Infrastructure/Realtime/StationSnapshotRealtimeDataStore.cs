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
        var keys = stationCodes.Select(code => (RedisKey)BuildStationKey(prefix, code)).ToArray();

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
                string.Join(',', stationCodes),
                sw.ElapsedMilliseconds);
            throw;
        }

        var byTagId = new Dictionary<long, RealtimeValue>();
        var wanted = ids.ToHashSet();

        for (var i = 0; i < stationCodes.Length; i++)
        {
            var stationCode = stationCodes[i];
            if (rawValues[i].IsNullOrEmpty)
            {
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
                snapshot = JsonSerializer.Deserialize<StationRealtimeSnapshotRedisModel>(json, SnapshotJsonOptions);
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

            StationRealtimeSnapshotMapper.FlattenInto(snapshot, wanted, byTagId);
        }

        logger.LogDebug(
            "Station snapshot read done. Stations={StationCount} RequestedTags={TagCount} HitTags={HitCount} DurationMs={DurationMs}",
            stationCodes.Length,
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
}
