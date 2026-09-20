using Backend.Application.Realtime;

namespace Backend.Infrastructure.Realtime;

/// <summary>Maps PLC station snapshot JSON model → tagId last-values.</summary>
public static class StationRealtimeSnapshotMapper
{
    public static void FlattenInto(
        StationRealtimeSnapshotRedisModel snapshot,
        IReadOnlySet<long> wantedTagIds,
        IDictionary<long, RealtimeValue> target)
    {
        // Current producer: Devices at station root.
        FlattenDevices(snapshot.Devices, wantedTagIds, target);

        // Legacy / alternate: Devices nested under each PLC.
        foreach (var plc in snapshot.PLCs)
            FlattenDevices(plc.Devices, wantedTagIds, target);
    }

    private static void FlattenDevices(
        IEnumerable<StationRealtimeDeviceRedisModel>? devices,
        IReadOnlySet<long> wantedTagIds,
        IDictionary<long, RealtimeValue> target)
    {
        if (devices is null) return;

        foreach (var device in devices)
        {
            if (device.Tags is null) continue;
            foreach (var tag in device.Tags)
            {
                if (!wantedTagIds.Contains(tag.TagId))
                    continue;

                target[tag.TagId] = new RealtimeValue
                {
                    TagId = tag.TagId,
                    Value = tag.Value,
                    Timestamp = tag.Timestamp == default ? DateTimeOffset.UtcNow : tag.Timestamp,
                    Quality = string.IsNullOrWhiteSpace(tag.Quality)
                        ? TagQualityNames.Uncertain
                        : tag.Quality
                };
            }
        }
    }
}
