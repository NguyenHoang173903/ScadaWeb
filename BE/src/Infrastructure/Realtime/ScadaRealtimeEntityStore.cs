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
        LoadManyAsync<RealtimeAlarmRedisModel>(stationCode, "ALARM", cancellationToken);

    public Task<IReadOnlyList<RealtimeOperatorRedisModel>> GetOperatorsAsync(
        string stationCode,
        CancellationToken cancellationToken = default) =>
        LoadManyAsync<RealtimeOperatorRedisModel>(stationCode, "OPERATOR", cancellationToken);

    private async Task<IReadOnlyList<T>> LoadManyAsync<T>(
        string stationCode,
        string entity,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var code = (stationCode ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(code))
            return [];

        var prefix = options.Value.ScadaEntityKeyPrefix?.Trim().TrimEnd(':') ?? "SCADA";
        var pattern = $"{prefix}:{code}:{entity}:*";
        var db = multiplexer.Connection.GetDatabase();
        var list = new List<T>();

        foreach (var endpoint in multiplexer.Connection.GetEndPoints())
        {
            cancellationToken.ThrowIfCancellationRequested();
            var server = multiplexer.Connection.GetServer(endpoint);
            if (server is null || !server.IsConnected || server.IsReplica)
                continue;

            await foreach (var key in server.KeysAsync(pattern: pattern, pageSize: 250)
                               .WithCancellation(cancellationToken))
            {
                var value = await db.StringGetAsync(key).ConfigureAwait(false);
                if (value.IsNullOrEmpty)
                    continue;

                try
                {
                    var model = JsonSerializer.Deserialize<T>((string)value!, JsonOptions);
                    if (model is not null)
                        list.Add(model);
                }
                catch (JsonException ex)
                {
                    logger.LogWarning(ex, "Invalid Redis JSON for key {Key}", key.ToString());
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
