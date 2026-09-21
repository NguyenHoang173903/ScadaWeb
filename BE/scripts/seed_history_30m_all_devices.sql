-- Seed history_30m cho báo cáo: mọi Tag của Level + Pump1–10 + Metter/Meter.
-- Chu kỳ 30 phút, 7 ngày gần nhất (Asia/Ho_Chi_Minh) → khớp bộ lọc ngày/giờ trên UI.
--
-- Chạy:
--   $env:PGPASSWORD='123456'
--   & 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h 100.99.230.105 -U postgres -d scada_tlhn -f BE/scripts/seed_history_30m_all_devices.sql

BEGIN;

CREATE TEMP TABLE tmp_report_tags ON COMMIT DROP AS
SELECT
  t."Id"   AS tag_id,
  t."Code" AS tag_code,
  d."Id"   AS device_id,
  d."Code" AS device_code,
  CASE
    WHEN d."Code" = 'Level'
      OR d."DeviceType" = 'Sensor'
      OR d."Code" ILIKE '%Level%' THEN 'level'
    WHEN d."Code" ~ '^Pump([1-9]|10)$'
      OR d."DeviceType" = 'Pump' THEN 'pump_temp'
    ELSE 'meter'
  END AS kind
FROM public."Tag" t
JOIN public."Device" d ON d."Id" = t."DeviceId"
WHERE
  d."Code" = 'Level'
  OR d."Code" ~ '^Pump([1-9]|10)$'
  OR d."DeviceType" = 'PowerMeter'
  OR d."Code" ILIKE '%Meter%'
  OR d."Code" ILIKE '%Metter%';

DO $$
DECLARE
  n int;
  d int;
BEGIN
  SELECT COUNT(*), COUNT(DISTINCT device_id) INTO n, d FROM tmp_report_tags;
  IF n = 0 THEN
    RAISE EXCEPTION 'Không tìm thấy Tag/Device để seed history_30m.';
  END IF;
  RAISE NOTICE 'history_30m seed: % tags trên % devices', n, d;
END $$;

DELETE FROM public.history_30m
WHERE "TagId" IN (SELECT tag_id FROM tmp_report_tags);

CREATE OR REPLACE FUNCTION pg_temp.fake_30m(kind text, tag_code text, tag_id bigint, ts timestamptz)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT round((
    CASE kind
      WHEN 'level' THEN
        CASE
          WHEN upper(tag_code) LIKE '%RIVER%' THEN 3.2
          WHEN upper(tag_code) LIKE '%DISCHARGE%' OR upper(tag_code) LIKE '%XA%' THEN 1.8
          ELSE 2.5
        END
        + 0.35 * sin(extract(epoch from ts) / 7200.0 + tag_id)
        + 0.12 * cos(extract(epoch from ts) / 3600.0)
      WHEN 'pump_temp' THEN
        CASE
          WHEN upper(tag_code) LIKE '%PHASEA%' OR upper(tag_code) IN ('TEMP_A', 'SET_TEMPA') THEN
            CASE WHEN upper(tag_code) LIKE 'SET_%' THEN 120 ELSE 42 END
          WHEN upper(tag_code) LIKE '%PHASEB%' OR upper(tag_code) IN ('TEMP_B', 'SET_TEMPB') THEN
            CASE WHEN upper(tag_code) LIKE 'SET_%' THEN 120 ELSE 45 END
          WHEN upper(tag_code) LIKE '%PHASEC%' OR upper(tag_code) IN ('TEMP_C', 'SET_TEMPC') THEN
            CASE WHEN upper(tag_code) LIKE 'SET_%' THEN 120 ELSE 48 END
          WHEN upper(tag_code) LIKE '%DEBEARING%' OR upper(tag_code) = 'SET_TEMPDE' THEN
            CASE WHEN upper(tag_code) LIKE 'SET_%' THEN 90 ELSE 38 END
          WHEN upper(tag_code) LIKE '%NDEBEARING%' OR upper(tag_code) = 'SET_TEMPNDE' THEN
            CASE WHEN upper(tag_code) LIKE 'SET_%' THEN 90 ELSE 36 END
          WHEN upper(tag_code) IN ('TIME_RUN_M', 'TOTAL_TIME_RUN_M') THEN 25
          WHEN upper(tag_code) IN ('TIME_RUN_H', 'TOTAL_TIME_RUN_H') THEN 40
          WHEN upper(tag_code) = 'FB_RUN' THEN
            CASE WHEN (extract(epoch from ts)::bigint / 1800) % 3 = 0 THEN 1 ELSE 0 END
          WHEN upper(tag_code) = 'FB_STOP' THEN
            CASE WHEN (extract(epoch from ts)::bigint / 1800) % 3 = 0 THEN 0 ELSE 1 END
          WHEN upper(tag_code) IN ('FB_FAULT', 'FB_MAINTENANCE') THEN 0
          ELSE 30
        END
        + CASE
            WHEN upper(tag_code) LIKE 'SET_%' OR upper(tag_code) LIKE 'FB_%' THEN 0
            WHEN upper(tag_code) LIKE 'TIME_%' OR upper(tag_code) LIKE 'TOTAL_%' THEN
              3 * sin(extract(epoch from ts) / 5400.0)
            ELSE
              4.5 * sin(extract(epoch from ts) / 5400.0 + tag_id * 0.17)
              + 1.8 * cos(extract(epoch from ts) / 2700.0)
          END
      ELSE
        CASE
          WHEN upper(replace(tag_code, '-', '_')) IN ('U12', 'U23', 'U31') THEN 400
          WHEN upper(replace(tag_code, '-', '_')) IN ('I1', 'I2', 'I3', 'I_PH') THEN 30
          WHEN upper(replace(tag_code, '-', '_')) = 'TOTAL_KW' THEN 120
          WHEN upper(replace(tag_code, '-', '_')) IN ('FREQ', 'FREQUENCY') THEN 50
          WHEN upper(replace(tag_code, '-', '_')) = 'KWH' THEN 100000
          WHEN upper(replace(tag_code, '-', '_')) IN ('POWER_FACTOR', 'PF') THEN 0.92
          ELSE 10
        END
        + CASE
            WHEN upper(replace(tag_code, '-', '_')) IN ('U12', 'U23', 'U31') THEN
              8 * sin(extract(epoch from ts) / 4800.0 + tag_id)
            WHEN upper(replace(tag_code, '-', '_')) IN ('I1', 'I2', 'I3', 'I_PH') THEN
              12 * sin(extract(epoch from ts) / 3600.0 + tag_id)
            WHEN upper(replace(tag_code, '-', '_')) = 'TOTAL_KW' THEN
              20 * sin(extract(epoch from ts) / 4200.0)
            WHEN upper(replace(tag_code, '-', '_')) IN ('FREQ', 'FREQUENCY') THEN
              0.15 * sin(extract(epoch from ts) / 3000.0)
            WHEN upper(replace(tag_code, '-', '_')) = 'KWH' THEN
              extract(epoch from ts) / 3600.0
            WHEN upper(replace(tag_code, '-', '_')) IN ('POWER_FACTOR', 'PF') THEN
              0.03 * sin(extract(epoch from ts) / 6000.0)
            ELSE
              2 * sin(extract(epoch from ts) / 5000.0 + tag_id)
          END
    END
  )::numeric, 2);
$$;

-- 7 ngày gần nhất, mỗi 30 phút (local VN)
INSERT INTO public.history_30m ("Time", "TagId", "Value")
SELECT s.ts, r.tag_id, pg_temp.fake_30m(r.kind, r.tag_code, r.tag_id, s.ts)
FROM (
  SELECT generate_series(
    date_trunc('day', (now() AT TIME ZONE 'Asia/Ho_Chi_Minh') - interval '6 days')
      AT TIME ZONE 'Asia/Ho_Chi_Minh',
    date_trunc('hour', now()) + interval '30 minutes',
    interval '30 minutes'
  ) AS ts
) s
CROSS JOIN tmp_report_tags r;

COMMIT;

SELECT
  COUNT(*) AS rows_30m,
  COUNT(DISTINCT "TagId") AS tags,
  MIN("Time") AS min_t,
  MAX("Time") AS max_t
FROM public.history_30m;

SELECT d."Code" AS device, COUNT(DISTINCT t."Id") AS tags, COUNT(h.*) AS hist_rows
FROM public."Device" d
JOIN public."Tag" t ON t."DeviceId" = d."Id"
LEFT JOIN public.history_30m h ON h."TagId" = t."Id"
WHERE d."Code" = 'Level'
   OR d."Code" ~ '^Pump([1-9]|10)$'
   OR d."Code" ILIKE '%Meter%'
   OR d."Code" ILIKE '%Metter%'
GROUP BY d."Code"
ORDER BY d."Code";
