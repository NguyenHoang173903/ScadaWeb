namespace Backend.Application.Realtime;

/// <summary>
/// Redis producer contract for <c>scada:station:{stationCode}</c> (JSON string).
/// Property names match PLC writer (PascalCase); deserialization is case-insensitive.
/// Live PLC writer places <see cref="Devices"/> at station root (sibling of <see cref="PLCs"/>);
/// nested <c>PLCs[].Devices</c> is still accepted for older payloads.
/// </summary>
public sealed class StationRealtimeSnapshotRedisModel
{
    public string? Station { get; set; }

    public List<StationRealtimePlcRedisModel> PLCs { get; set; } = [];

    /// <summary>Station-level devices (current PLC writer shape).</summary>
    public List<StationRealtimeDeviceRedisModel> Devices { get; set; } = [];
}

public sealed class StationRealtimePlcRedisModel
{
    public string? Code { get; set; }

    public List<StationRealtimeDeviceRedisModel> Devices { get; set; } = [];
}

public sealed class StationRealtimeDeviceRedisModel
{
    public string? Code { get; set; }

    public List<StationRealtimeTagRedisModel> Tags { get; set; } = [];
}

public sealed class StationRealtimeTagRedisModel
{
    public long TagId { get; set; }

    public string? Code { get; set; }

    public string? Tag { get; set; }

    public string? DisplayName { get; set; }

    public string? Datatype { get; set; }

    public string? Unit { get; set; }

    /// <summary>
    /// PLC may emit number, null, or boolean. Parsed via <see cref="StationRealtimeValueJsonConverter"/>.
    /// </summary>
    [System.Text.Json.Serialization.JsonConverter(typeof(StationRealtimeValueJsonConverter))]
    public object? Value { get; set; }

    public string? Quality { get; set; }

    public DateTimeOffset Timestamp { get; set; }
}
