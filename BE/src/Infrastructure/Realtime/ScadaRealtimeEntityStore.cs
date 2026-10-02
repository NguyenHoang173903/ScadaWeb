using System.Text.Json;
using System.Text.Json.Serialization;
using Backend.Application.Interfaces.Services.Scada;
using Backend.Application.Options;
using Backend.Application.Realtime;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Backend.Infrastructure.Realtime;

/// <summary>
/// Đọc ALARM / OPERATOR JSON từ RealtimeRedis theo contract SCADA.
/// </summary>
public sealed class ScadaRealtimeEntityStore(
    IStationRealtimeMultiplexer multiplexer,
    IOptions<RealtimeOptions> options,
    ILogger<ScadaRealtimeEntityStore> logger) : IScadaRealtimeEntityStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        NumberHandling = JsonNumberHandling.AllowReadingFromString
    };

    public Task<IReadOnlyList<RealtimeAlarmRedisModel>> GetAlarmsAsync(
        string stationCode,
        CancellationToken cancellationToken = default) =>
        LoadManyAsync<RealtimeAlarmRedisModel>(stationCode, "ALARM", "ALARMS", cancellationToken);

    public Task<IReadOnlyList<RealtimeOperatorRedisModel>> GetOperatorsAsync(
        string stationCode,
        CancellationToken cancellationToken = default) =>
        LoadManyAsync<RealtimeOperatorRedisModel>(stationCode, "OPERATOR", "OPERATORS", cancellationToken);

    public static IReadOnlyList<T> ParsePayloadForEntity<T>(string json, string entityCollectionName)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (root.ValueKind == JsonValueKind.Array)
        {
            var items = new List<T>();
            foreach (var element in root.EnumerateArray())
            {
                var item = JsonSerializer.Deserialize<T>(element.GetRawText(), JsonOptions);
                if (item is not null)
                    items.Add(item);
            }

            return items;
        }

        if (root.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in root.EnumerateObject())
            {
                if (!string.Equals(property.Name, entityCollectionName, StringComparison.OrdinalIgnoreCase))
                    continue;

                if (property.Value.ValueKind != JsonValueKind.Array)
                    continue;

                var items = new List<T>();
                foreach (var element in property.Value.EnumerateArray())
                {
                    var item = JsonSerializer.Deserialize<T>(element.GetRawText(), JsonOptions);
                    if (item is not null)
                        items.Add(item);
                }

                return items;
            }
        }

        return [];
    }

    private async Task<IReadOnlyList<T>> LoadManyAsync<T>(
        string stationCode,
        string entity,
        string entityCollectionName,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var code = (stationCode ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(code))
            return [];

        var db = multiplexer.Connection.GetDatabase();
        var list = new List<T>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var scadaPrefix = options.Value.ScadaEntityKeyPrefix?.Trim().TrimEnd(':') ?? "SCADA";
        var stationPrefix = options.Value.StationKeyPrefix?.Trim().TrimEnd(':') ?? "scada:station";

        var directKeys = new[]
        {
            $"{stationPrefix}:{code}:{entityCollectionName.ToLowerInvariant()}",
            $"{stationPrefix}:{code}:{entityCollectionName}",
            $"{stationPrefix}:{code}:{entity}",
            $"{scadaPrefix}:{code}:{entity}"
        };

        foreach (var key in directKeys.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            var value = await db.StringGetAsync(key).ConfigureAwait(false);
            if (value.IsNullOrEmpty)
                continue;

            var parsed = ParsePayloadForEntity<T>((string)value!, entityCollectionName);
            foreach (var item in parsed)
            {
                var keyId = item?.GetType().GetProperty("Id")?.GetValue(item)?.ToString()
                    ?? item?.GetType().GetProperty("ID")?.GetValue(item)?.ToString();
                if (!string.IsNullOrEmpty(keyId))
                    seen.Add(keyId!);
                list.Add(item!);
            }
        }

        foreach (var endpoint in multiplexer.Connection.GetEndPoints())
        {
            cancellationToken.ThrowIfCancellationRequested();
            var server = multiplexer.Connection.GetServer(endpoint);
            if (server is null || !server.IsConnected || server.IsReplica)
                continue;

            var wildcardPatterns = new[]
            {
                $"{scadaPrefix}:{code}:{entity}:*",
                $"{stationPrefix}:{code}:{entityCollectionName.ToLowerInvariant()}:*",
                $"{stationPrefix}:{code}:{entityCollectionName}:*"
            };

            foreach (var pattern in wildcardPatterns.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                await foreach (var key in server.KeysAsync(pattern: pattern, pageSize: 250)
                                   .WithCancellation(cancellationToken))
                {
                    if (seen.Contains(key.ToString()!))
                        continue;

                    var value = await db.StringGetAsync(key).ConfigureAwait(false);
                    if (value.IsNullOrEmpty)
                        continue;

                    try
                    {
                        var item = JsonSerializer.Deserialize<T>((string)value!, JsonOptions);
                        if (item is not null)
                            list.Add(item);
                    }
                    catch (JsonException ex)
                    {
                        logger.LogWarning(ex, "Invalid Redis JSON for key {Key}", key.ToString());
                    }
                }
            }
        }

        return list;
    }
}

/// <summary>No-op khi không dùng StationSnapshot / RealtimeRedis.</summary>
public sealed class NoopScadaRealtimeEntityStore : IScadaRealtimeEntityStore
{
    public Task<IReadOnlyList<RealtimeAlarmRedisModel>> GetAlarmsAsync(
        string stationCode,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<RealtimeAlarmRedisModel>>([]);

    public Task<IReadOnlyList<RealtimeOperatorRedisModel>> GetOperatorsAsync(
        string stationCode,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<RealtimeOperatorRedisModel>>([]);
}
