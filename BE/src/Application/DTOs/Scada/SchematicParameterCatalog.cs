using Backend.Shared.Constants;

namespace Backend.Application.DTOs.Scada;

/// <summary>Catalog map tag sơ đồ nguyên lý.</summary>
public static class SchematicParameterCatalog
{
    public sealed record Definition(string Key, string[] Aliases);

    public static IReadOnlyList<Definition> MeasureDefinitions { get; } =
    [
        new("i1", ["I1", "CURRENT_L1", "PHASE_I1", "IA", "METER_I1"]),
        new("i2", ["I2", "CURRENT_L2", "PHASE_I2", "IB", "METER_I2"]),
        new("i3", ["I3", "CURRENT_L3", "PHASE_I3", "IC", "METER_I3"]),
        // V1/V2/V3 trên sơ đồ = điện áp dây (Excel TLHN: U12/U23/U31), không phải điện áp pha U1/U2/U3.
        new("v1", ElectricalAliases("voltageRs")),
        new("v2", ElectricalAliases("voltageSt")),
        new("v3", ElectricalAliases("voltageTr")),
        new("currentA", ["I_PH", "CURRENT", "I_LOAD", "DONG_DIEN", "I_A"]),
        new("runtimeH", ["TOTAL_TIME_RUN_H", "TOTAL_TIME_RUN_M", "TIME_RUN_M", "RUNTIME", "RUNTIME_H", "RUN_HOURS", "T_GIAN", "HOURS"]),
        new("ratedPowerKw", ["RATED_POWER", "RATED_KW", "POWER_RATED", "PN"]),
    ];

    public static IReadOnlyList<Definition> StatusDefinitions { get; } =
    [
        new("motorStatus", ["FB_RUN", "MOTOR_STATUS", "PUMP_STATUS", "M_STATUS"]),
        new("kdmStatus", ["FB_RUN", "KDM_STATUS", "KDM", "STARTER_STATUS"]),
        // Excel TLHN: FB_ON_MCCB (bool) — true = đóng MCCB / có điện; false = mở cầu dao.
        new("lockStatus", ["FB_ON_MCCB", "ON_MCCB", "MCCB_ON", "LOCK_STATUS", "LOCK", "BREAKER", "MCCB_STATUS", "MCCB"]),
        new("faultStatus", ["FB_FAULT", "FB_FAULT_SS", "FB_FAULT_TEMP", "FB_FAULT_V", "FB_FAULT_CURENT"]),
        new("stopStatus", ["FB_STOP"]),
        new("maintenanceStatus", ["FB_MAINTENANCE"]),
    ];

    private static string[] ElectricalAliases(string key) =>
        ElectricalParameterCatalog.Definitions.First(d => d.Key == key).Aliases;

    public static bool Matches(Definition def, string? raw) =>
        ElectricalParameterCatalog.Matches(
            new ElectricalParameterCatalog.Definition(def.Key, def.Key, null, def.Aliases),
            raw);

    public static string MapMotorStatus(double? value, string? rawCode = null) =>
        ScadaStatusMapper.MapMotorStatus(value, rawCode);

    public static string MapKdmStatus(double? value, string? rawCode = null) =>
        ScadaStatusMapper.MapKdmStatus(value, rawCode);

    public static string MapLockStatus(double? value, string? rawCode = null) =>
        ScadaStatusMapper.MapLockStatus(value, rawCode);

    public static string ResolveKdmStatus(string motorStatus, string kdmStatus) =>
        ScadaStatusMapper.ResolveKdmStatus(motorStatus, kdmStatus);
}
