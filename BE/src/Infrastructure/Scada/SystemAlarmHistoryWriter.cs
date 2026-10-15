using Backend.Application.Interfaces.Services.Scada;
using Backend.Domain.Entities.History;
using Backend.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Scada;

/// <summary>
/// Insert lỗi hệ thống vào <c>alarm_history</c>.
/// <list type="bullet">
/// <item><c>SYSTEM</c> / EventTypeId 22 — lỗi API</item>
/// <item><c>Communication</c> / EventTypeId 23 — lỗi Redis</item>
/// </list>
/// Debounce Redis để không flood mỗi poll 2s.
/// </summary>
public sealed class SystemAlarmHistoryWriter(
    IServiceScopeFactory scopeFactory,
    ILogger<SystemAlarmHistoryWriter> logger) : ISystemAlarmHistoryWriter
{
    public const string TypeSystem = "SYSTEM";
    public const string TypeCommunication = "Communication";
    public const long EventTypeSystem = 22;
    public const long EventTypeCommunication = 23;

    private static readonly TimeSpan RedisErrorMinInterval = TimeSpan.FromMinutes(2);
    private DateTimeOffset _lastRedisErrorAt = DateTimeOffset.MinValue;
    private readonly object _redisGate = new();

    public Task WriteApiErrorAsync(
        string description,
        string? detail = null,
        CancellationToken cancellationToken = default) =>
        WriteCoreAsync(
            TypeSystem,
            EventTypeSystem,
            deviceName: "Backend.Api",
            tagName: "Api_Status",
            description,
            detail,
            cancellationToken);

    public Task WriteRedisErrorAsync(
        string description,
        string? detail = null,
        CancellationToken cancellationToken = default)
    {
        lock (_redisGate)
        {
            var now = DateTimeOffset.UtcNow;
            if (now - _lastRedisErrorAt < RedisErrorMinInterval)
                return Task.CompletedTask;
            _lastRedisErrorAt = now;
        }

        return WriteCoreAsync(
            TypeCommunication,
            EventTypeCommunication,
            deviceName: "Redis",
            tagName: "Redis_Status",
            description,
            detail,
            cancellationToken);
    }

    private async Task WriteCoreAsync(
        string type,
        long eventTypeId,
        string deviceName,
        string tagName,
        string description,
        string? detail,
        CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var now = DateTimeOffset.UtcNow;
            var text = string.IsNullOrWhiteSpace(detail)
                ? description.Trim()
                : $"{description.Trim()}: {detail.Trim()}";
            if (text.Length > 500)
                text = text[..500];

            db.AlarmHistories.Add(new AlarmHistory
            {
                StationId = null,
                PlcId = null,
                DeviceId = null,
                TagId = null,
                TagEventConfigId = null,
                EventTypeId = eventTypeId,
                TriggerTypeId = null,
                DeviceName = deviceName,
                TagName = tagName,
                Description = text,
                TroubleshootingGuide = null,
                Type = type,
                IsAcknowledged = false,
                DurationSeconds = null,
                StartTime = now,
                EndTime = null,
                CreatedAt = now
            });

            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation(
                "System alarm_history inserted. Type={Type} Description={Description}",
                type,
                text);
        }
        catch (Exception ex)
        {
            // Không để việc ghi lịch sử làm sập host / che lỗi gốc.
            logger.LogWarning(ex, "Failed to insert system alarm_history. Type={Type}", type);
        }
    }
}
