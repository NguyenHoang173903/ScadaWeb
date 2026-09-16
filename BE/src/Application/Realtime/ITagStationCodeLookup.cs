namespace Backend.Application.Realtime;

/// <summary>Resolves TagId → Station.Code for building <c>scada:station:{code}</c> keys.</summary>
public interface ITagStationCodeLookup
{
    Task<IReadOnlyDictionary<long, string>> GetStationCodesByTagIdsAsync(
        IReadOnlyCollection<long> tagIds,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<string>> GetAllActiveStationCodesAsync(
        CancellationToken cancellationToken = default);
}
