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
        foreach (var plc in snapshot.PLCs)
        {
            if (plc.Devices is null) continue;
            foreach (var device in plc.Devices)
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
}
