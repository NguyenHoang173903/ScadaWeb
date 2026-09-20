using StackExchange.Redis;

namespace Backend.Infrastructure.Realtime;

/// <summary>Optional dedicated multiplexer for PLC station snapshots (may differ from session Redis).</summary>
public interface IStationRealtimeMultiplexer
{
    IConnectionMultiplexer Connection { get; }
}

public sealed class StationRealtimeMultiplexer(IConnectionMultiplexer connection) : IStationRealtimeMultiplexer
{
    public IConnectionMultiplexer Connection { get; } = connection;
}
