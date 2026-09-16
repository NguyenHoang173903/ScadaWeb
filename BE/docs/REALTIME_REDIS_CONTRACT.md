# Redis realtime contract (Scada_TLHN)

## Key / value

| Item | Value |
|------|--------|
| Key pattern | `scada:station:{stationCode}` |
| Example | `scada:station:TBAB` |
| Redis type | STRING |
| Serialization | JSON (PascalCase properties from PLC writer) |
| Producer | Scada.Service.PLC_S7 (external) |
| Consumer | Scada.API `StationSnapshotRealtimeDataStore` |
| TTL | ~10s (observed on live Redis) |
| Update frequency | PLC cycle (seconds) |

## Payload shape

```json
{
  "Station": "TBAB",
  "PLCs": [
    {
      "Code": "PLC1",
      "Devices": [
        {
          "Code": "Level",
          "Tags": [
            {
              "TagId": 605,
              "Code": "River",
              "Tag": "Level_River",
              "Datatype": "Real",
              "Unit": "mét",
              "Value": 2.36,
              "Quality": "Good",
              "Timestamp": "2026-09-16T09:24:06.343+07:00"
            }
          ]
        }
      ]
    }
  ]
}
```

## Payload notes

- `Value` may be **number**, **null**, or **boolean** (digital tags).
- Deserialization uses PascalCase-tolerant options (**not** project `JsonHelper` camelCase policy — acronym `PLCs` breaks otherwise).
- Missing Redis key / tag → API returns `Quality=Uncertain`, `Value=null` (no fake numbers).
- `Realtime:SimulateChanges` must stay **false** in production.

```json
"ConnectionStrings": {
  "Redis": "localhost:6379",
  "RealtimeRedis": "HOST:6379"
},
"Realtime": {
  "Provider": "StationSnapshot",
  "StationKeyPrefix": "scada:station",
  "SimulateChanges": false,
  "FallbackToHistoryOnMiss": false
}
```

- `ConnectionStrings:RealtimeRedis` — optional dedicated SCADA Redis (session/login keep using `Redis`).
- `SimulateChanges=false` — disables fake PLC hosted service.
- Missing key / missing tag → API returns `Quality=Uncertain`, `Value=null` (no fake numbers).

## Verify

```bash
redis-cli -h <host> -p 6379 --raw GET scada:station:TBAB
# then
GET /api/v1/stations/1/electrical
GET /api/v1/screens/{screen}/snapshot?stationId=1
```
