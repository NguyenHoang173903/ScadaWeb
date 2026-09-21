using Backend.Application.Realtime;

namespace Backend.Application.Interfaces.Services.Scada;

/// <summary>
/// Đọc entity realtime SCADA từ Redis (không phải station snapshot tag).
/// Key: <c>{prefix}:{stationCode}:ALARM:{id}</c>, <c>{prefix}:{stationCode}:OPERATOR:{id}</c>.
/// </summary>
public interface IScadaRealtimeEntityStore
{
    Task<IReadOnlyList<RealtimeAlarmRedisModel>> GetAlarmsAsync(
        string stationCode,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RealtimeOperatorRedisModel>> GetOperatorsAsync(
        string stationCode,
        CancellationToken cancellationToken = default);
}
