using System.Text.Json;
using Backend.Application.Realtime;
using Backend.Infrastructure.Realtime;
using Backend.Shared.Helpers;

namespace Backend.UnitTests;

public class StationSnapshotRealtimeDataStoreTests
{
    [Fact]
    public void BuildStationKey_joins_prefix_and_code()
    {
        Assert.Equal(
            "scada:station:TBAB",
            StationSnapshotRealtimeDataStore.BuildStationKey("scada:station", "TBAB"));
    }

    [Fact]
    public void SnapshotOptions_deserializes_pascal_case_station_snapshot()
    {
        const string json = """
            {"Station":"TBAB","PLCs":[{"Code":"PLC1","Devices":[{"Code":"Level","Tags":[
              {"TagId":605,"Code":"River","Tag":"Level_River","Datatype":"Real","Unit":"mét","Value":2.36,"Quality":"Good","Timestamp":"2026-09-16T09:24:06.343+07:00"},
              {"TagId":606,"Code":"Discharge1","Value":null,"Quality":"Uncertain","Timestamp":"2026-09-16T09:24:06.343+07:00"}
            ]}]}]}
            """;

        var model = JsonSerializer.Deserialize<StationRealtimeSnapshotRedisModel>(
            json,
            StationSnapshotRealtimeDataStore.SnapshotJsonOptions);
        Assert.NotNull(model);
        Assert.Equal("TBAB", model!.Station);
        Assert.Equal(605, model.PLCs[0].Devices[0].Tags[0].TagId);
        Assert.Equal(2.36, Assert.IsType<double>(model.PLCs[0].Devices[0].Tags[0].Value!));
        Assert.Null(model.PLCs[0].Devices[0].Tags[1].Value);
    }

    [Fact]
    public void FlattenInto_maps_requested_tags_only_without_faking_missing()
    {
        var snapshot = JsonSerializer.Deserialize<StationRealtimeSnapshotRedisModel>("""
            {"Station":"TBAB","PLCs":[{"Code":"PLC1","Devices":[{"Code":"Level","Tags":[
              {"TagId":605,"Value":2.36,"Quality":"Good","Timestamp":"2026-09-16T09:24:06.343+07:00"},
              {"TagId":999,"Value":1,"Quality":"Good","Timestamp":"2026-09-16T09:24:06.343+07:00"}
            ]}]}]}
            """, StationSnapshotRealtimeDataStore.SnapshotJsonOptions)!;

        var target = new Dictionary<long, RealtimeValue>();
        StationRealtimeSnapshotMapper.FlattenInto(snapshot, new HashSet<long> { 605, 606 }, target);

        Assert.True(target.ContainsKey(605));
        Assert.Equal(2.36, Assert.IsType<double>(target[605].Value!));
        Assert.False(target.ContainsKey(606));
        Assert.False(target.ContainsKey(999));
    }

    [Fact]
    public void FlattenInto_preserves_null_value_with_uncertain_quality()
    {
        var snapshot = JsonSerializer.Deserialize<StationRealtimeSnapshotRedisModel>("""
            {"Station":"TBAB","PLCs":[{"Code":"PLC1","Devices":[{"Code":"Level","Tags":[
              {"TagId":606,"Value":null,"Quality":"Uncertain","Timestamp":"2026-09-16T09:24:06.343+07:00"}
            ]}]}]}
            """, StationSnapshotRealtimeDataStore.SnapshotJsonOptions)!;

        var target = new Dictionary<long, RealtimeValue>();
        StationRealtimeSnapshotMapper.FlattenInto(snapshot, new HashSet<long> { 606 }, target);

        Assert.Null(target[606].Value);
        Assert.Equal(TagQualityNames.Uncertain, target[606].Quality);
    }

    [Fact]
    public void SnapshotOptions_deserializes_saved_tbab_payload()
    {
        var path = @"d:\WEB_TLN\BE\scripts\_tbab.json";
        Assert.True(File.Exists(path), "Run redis GET save to scripts/_tbab.json first");
        var json = File.ReadAllText(path);
        StationRealtimeSnapshotRedisModel? model = null;
        var ex = Record.Exception(() =>
        {
            model = JsonSerializer.Deserialize<StationRealtimeSnapshotRedisModel>(
                json,
                StationSnapshotRealtimeDataStore.SnapshotJsonOptions);
        });
        Assert.Null(ex);
        Assert.NotNull(model);
        Assert.Equal("TBAB", model!.Station);
        var tags = model.PLCs.SelectMany(p => p.Devices).SelectMany(d => d.Tags).ToList();
        Assert.Contains(tags, t => t.TagId == 605);
        Assert.True(tags.Count > 100);
    }

    [Fact]
    public void JsonHelper_camelCase_policy_fails_or_differs_on_PLCs_acronym()
    {
        // Documents why StationSnapshot must NOT use JsonHelper.DefaultOptions for PLC payloads.
        var path = @"d:\WEB_TLN\BE\scripts\_tbab.json";
        if (!File.Exists(path)) return;
        var json = File.ReadAllText(path);
        var viaHelper = JsonHelper.TryDeserialize<StationRealtimeSnapshotRedisModel>(json, out var helperModel);
        var viaSnapshot = JsonSerializer.Deserialize<StationRealtimeSnapshotRedisModel>(
            json,
            StationSnapshotRealtimeDataStore.SnapshotJsonOptions);
        Assert.NotNull(viaSnapshot);
        Assert.True(viaSnapshot!.PLCs.Count > 0);
        // Helper may fail entirely or return empty PLCs depending on STJ version.
        if (viaHelper && helperModel is not null)
            Assert.True(helperModel.PLCs.Count == 0 || helperModel.PLCs.Count == viaSnapshot.PLCs.Count);
    }
}
