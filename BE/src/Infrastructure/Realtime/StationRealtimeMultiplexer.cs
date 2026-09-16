using StackExchange.Redis;

namespace Backend.Infrastructure.Realtime;

/// <summary>Optional dedicated multiplexer for PLC station snapshots (may differ from session Redis).</summary>
internal interface IStationRealtimeMultiplexer
{
    IConnectionMultiplexer Connection { get; }
}

internal sealed class StationRealtimeMultiplexer(IConnectionMultiplexer connection) : IStationRealtimeMultiplexer
{
    public IConnectionMultiplexer Connection { get; } = connection;
}
