namespace Backend.Application.Options;

/// <summary>Bound from "Realtime" in appsettings.</summary>
public class RealtimeOptions
{
    public const string SectionName = "Realtime";

    /// <summary>
    /// <c>Fake</c> — in-memory.
    /// <c>Redis</c> — per-tag keys <c>{RedisKeyPrefix}:{tagId}</c> (legacy/simulator).
    /// <c>StationSnapshot</c> — PLC keys <c>{StationKeyPrefix}:{stationCode}</c> (production).
    /// </summary>
    public string Provider { get; set; } = "Fake";

    /// <summary>Legacy per-tag prefix (Provider=Redis).</summary>
    public string RedisKeyPrefix { get; set; } = "scada:rt";

    /// <summary>Production station snapshot prefix (Provider=StationSnapshot).</summary>
    public string StationKeyPrefix { get; set; } = "scada:station";

    /// <summary>
    /// Prefix entity SCADA (alarm / operator) trên RealtimeRedis.
    /// Key: <c>{ScadaEntityKeyPrefix}:{stationCode}:ALARM:{id}</c>,
    /// <c>{ScadaEntityKeyPrefix}:{stationCode}:OPERATOR:{id}</c>.
    /// </summary>
    public string ScadaEntityKeyPrefix { get; set; } = "SCADA";

    /// <summary>When true, hosted fake PLC simulator writes values and SignalR deltas.</summary>
    public bool SimulateChanges { get; set; } = false;

    public int SimulateIntervalSeconds { get; set; } = 2;

    /// <summary>
    /// When live Redis miss, fill from history_1s (electrical/schematic/monitor).
    /// Keep false for production StationSnapshot so missing ≠ fake/stale-as-live.
    /// </summary>
    public bool FallbackToHistoryOnMiss { get; set; } = false;

    /// <summary>Cache TTL for TagId → Station.Code lookup.</summary>
    public int TagStationLookupCacheSeconds { get; set; } = 60;

    /// <summary>
    /// Poll Redis station snapshot keys and SignalR-notify subscribed screens when payload changes.
    /// Used when Provider=StationSnapshot (PLC writer does not publish TagChanged).
    /// </summary>
    public int SnapshotWatchIntervalSeconds { get; set; } = 2;

    public bool SeedExcelOnStartup { get; set; } = true;

    /// <summary>Workbook used only to seed tag/device/screen mapping. Not a runtime database.</summary>
    public string ExcelPath { get; set; } = "data/Dinh_Nghia_Tag_Thuy_Loi_Ha_Noi.xlsx";
}
