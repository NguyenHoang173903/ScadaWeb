using Backend.Application.Options;
using Backend.Application.Realtime;
using Backend.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Backend.Infrastructure.Realtime;

/// <summary>Cached TagId → Station.Code map (DB metadata, not Redis).</summary>
public sealed class TagStationCodeLookup(
    IServiceScopeFactory scopeFactory,
    IOptions<RealtimeOptions> options,
    ILogger<TagStationCodeLookup> logger) : ITagStationCodeLookup
{
    private readonly object _gate = new();
    private Dictionary<long, string> _map = new();
    private List<string> _stationCodes = [];
    private DateTimeOffset _loadedAt = DateTimeOffset.MinValue;

    public async Task<IReadOnlyDictionary<long, string>> GetStationCodesByTagIdsAsync(
        IReadOnlyCollection<long> tagIds,
        CancellationToken cancellationToken = default)
    {
        await EnsureLoadedAsync(cancellationToken);
        var result = new Dictionary<long, string>();
        foreach (var id in tagIds.Distinct())
        {
            if (_map.TryGetValue(id, out var code))
                result[id] = code;
        }

        return result;
    }

    public async Task<IReadOnlyList<string>> GetAllActiveStationCodesAsync(
        CancellationToken cancellationToken = default)
    {
        await EnsureLoadedAsync(cancellationToken);
        return _stationCodes;
    }

    private async Task EnsureLoadedAsync(CancellationToken cancellationToken)
    {
        var ttl = TimeSpan.FromSeconds(Math.Max(30, options.Value.TagStationLookupCacheSeconds));
        if (DateTimeOffset.UtcNow - _loadedAt < ttl && _map.Count > 0)
            return;

        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var rows = await (
            from t in db.Tags.AsNoTracking()
            join p in db.Plcs.AsNoTracking() on t.PlcId equals p.Id
            join s in db.Stations.AsNoTracking() on p.StationId equals s.Id
            where s.IsActive
            select new { t.Id, StationCode = s.Code })
            .ToListAsync(cancellationToken);

        var map = rows
            .Where(r => !string.IsNullOrWhiteSpace(r.StationCode))
            .GroupBy(r => r.Id)
            .ToDictionary(g => g.Key, g => g.First().StationCode.Trim());

        var codes = map.Values
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(c => c, StringComparer.OrdinalIgnoreCase)
            .ToList();

        lock (_gate)
        {
            _map = map;
            _stationCodes = codes;
            _loadedAt = DateTimeOffset.UtcNow;
        }

        logger.LogDebug(
            "Tag→station lookup refreshed: {TagCount} tags, {StationCount} stations",
            map.Count,
            codes.Count);
    }
}
