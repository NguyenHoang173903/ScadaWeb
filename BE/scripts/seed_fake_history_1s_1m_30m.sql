-- Fake history cho chart / báo cáo / realtime fallback.
-- Bảng: public.history_1s, public.history_1m, public.history_30m
-- Dùng Tag.Id thật từ public."Tag" (TBAB / toàn DB).
--
-- Chạy:
--   $env:PGPASSWORD='123456'
--   & 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h 100.99.230.105 -U postgres -d scada_tlhn -f BE/scripts/seed_fake_history_1s_1m_30m.sql

BEGIN;

-- Tag dùng chung (Level + nhiệt Pump1–10 + điện Metter/Meter + runtime/status hay dùng)
CREATE TEMP TABLE tmp_seed_tags ON COMMIT DROP AS
WITH report_tags AS (
  SELECT t."Id" AS tag_id, t."Code" AS tag_code, 'level'::text AS kind
  FROM public."Tag" t
  JOIN public."Device" d ON d."Id" = t."DeviceId"
  WHERE d."Code" = 'Level'
    AND upper(t."Code") IN ('RIVER', 'DISCHARGE1')

  UNION ALL

  SELECT t."Id", t."Code", 'pump_temp'
  FROM public."Tag" t
  JOIN public."Device" d ON d."Id" = t."DeviceId"
  WHERE d."Code" ~ '^Pump([1-9]|10)$'
    AND upper(t."Code") IN (
      'FB_TEMP_PHASEA', 'FB_TEMP_PHASEB', 'FB_TEMP_PHASEC',
      'FB_TEMP_DEBEARING', 'FB_TEMP_NDEBEARING',
      'SET_TEMPA', 'SET_TEMPB', 'SET_TEMPC', 'SET_TEMPDE', 'SET_TEMPNDE',
      'TIME_RUN_M', 'TIME_RUN_H', 'TOTAL_TIME_RUN_M', 'TOTAL_TIME_RUN_H',
      'FB_RUN', 'FB_STOP', 'FB_FAULT', 'FB_MAINTENANCE'
    )

  UNION ALL

  SELECT t."Id", t."Code", 'meter'
  FROM public."Tag" t
  JOIN public."Device" d ON d."Id" = t."DeviceId"
  WHERE (
      d."DeviceType" = 'PowerMeter'
      OR d."Code" ILIKE '%Meter%'
      OR d."Code" ILIKE '%Metter%'
    )
    AND upper(replace(t."Code", '-', '_')) IN (
      'U12', 'U23', 'U31', 'I1', 'I2', 'I3', 'I_PH',
      'TOTAL_KW', 'POWER_FACTOR', 'PF', 'FREQ', 'FREQUENCY', 'KWH'
    )
)
SELECT DISTINCT tag_id, tag_code, kind FROM report_tags;

DO $$
DECLARE
  n int;
BEGIN
  SELECT COUNT(*) INTO n FROM tmp_seed_tags;
  IF n = 0 THEN
    RAISE EXCEPTION 'Không tìm thấy Tag để seed — kiểm tra bảng Tag/Device.';
  END IF;
  RAISE NOTICE 'Seed tags: %', n;
END $$;

-- Xóa mẫu cũ của các tag này (giữ tag khác nếu có)
DELETE FROM public.history_1s  WHERE "TagId" IN (SELECT tag_id FROM tmp_seed_tags);
DELETE FROM public.history_1m  WHERE "TagId" IN (SELECT tag_id FROM tmp_seed_tags);
DELETE FROM public.history_30m WHERE "TagId" IN (SELECT tag_id FROM tmp_seed_tags);

-- Giá trị fake theo loại tag + dao động theo thời gian
CREATE OR REPLACE FUNCTION pg_temp.fake_value(kind text, tag_code text, tag_id bigint, ts timestamptz)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT round((
    CASE kind
      WHEN 'level' THEN
        CASE WHEN upper(tag_code) = 'RIVER' THEN 3.2 ELSE 1.8 END
        + 0.35 * sin(extract(epoch from ts) / 7200.0 + tag_id)
        + 0.12 * cos(extract(epoch from ts) / 3600.0)
      WHEN 'pump_temp' THEN
        CASE
          WHEN upper(tag_code) LIKE '%PHASEA%' OR upper(tag_code) = 'SET_TEMPA' THEN
            CASE WHEN upper(tag_code) LIKE 'SET_%' THEN 120 ELSE 42 END
          WHEN upper(tag_code) LIKE '%PHASEB%' OR upper(tag_code) = 'SET_TEMPB' THEN
            CASE WHEN upper(tag_code) LIKE 'SET_%' THEN 120 ELSE 45 END
          WHEN upper(tag_code) LIKE '%PHASEC%' OR upper(tag_code) = 'SET_TEMPC' THEN
            CASE WHEN upper(tag_code) LIKE 'SET_%' THEN 120 ELSE 48 END
          WHEN upper(tag_code) LIKE '%DEBEARING%' OR upper(tag_code) = 'SET_TEMPDE' THEN
            CASE WHEN upper(tag_code) LIKE 'SET_%' THEN 90 ELSE 38 END
          WHEN upper(tag_code) LIKE '%NDEBEARING%' OR upper(tag_code) = 'SET_TEMPNDE' THEN
            CASE WHEN upper(tag_code) LIKE 'SET_%' THEN 90 ELSE 36 END
          WHEN upper(tag_code) IN ('TIME_RUN_M', 'TOTAL_TIME_RUN_M') THEN 25
          WHEN upper(tag_code) IN ('TIME_RUN_H', 'TOTAL_TIME_RUN_H') THEN 40
          WHEN upper(tag_code) IN ('FB_RUN') THEN
            CASE WHEN (extract(epoch from ts)::bigint / 300) % 3 = 0 THEN 1 ELSE 0 END
          WHEN upper(tag_code) IN ('FB_STOP') THEN
            CASE WHEN (extract(epoch from ts)::bigint / 300) % 3 = 0 THEN 0 ELSE 1 END
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
          WHEN upper(tag_code) IN ('U12', 'U23', 'U31') THEN 400
          WHEN upper(tag_code) IN ('I1', 'I2', 'I3', 'I_PH') THEN 30
          WHEN upper(tag_code) = 'TOTAL_KW' THEN 120
          WHEN upper(tag_code) IN ('FREQ', 'FREQUENCY') THEN 50
          WHEN upper(tag_code) = 'KWH' THEN 100000
          ELSE 0.92
        END
        + CASE
            WHEN upper(tag_code) IN ('U12', 'U23', 'U31') THEN
              8 * sin(extract(epoch from ts) / 4800.0 + tag_id)
            WHEN upper(tag_code) IN ('I1', 'I2', 'I3', 'I_PH') THEN
              12 * sin(extract(epoch from ts) / 3600.0 + tag_id)
            WHEN upper(tag_code) = 'TOTAL_KW' THEN
              20 * sin(extract(epoch from ts) / 4200.0)
            WHEN upper(tag_code) IN ('FREQ', 'FREQUENCY') THEN
              0.15 * sin(extract(epoch from ts) / 3000.0)
            WHEN upper(tag_code) = 'KWH' THEN
              extract(epoch from ts) / 3600.0
            ELSE
              0.03 * sin(extract(epoch from ts) / 6000.0)
          END
    END
  )::numeric, 2);
$$;

-- ========== history_30m: 3 ngày, mỗi 30 phút ==========
INSERT INTO public.history_30m ("Time", "TagId", "Value")
SELECT s.ts, r.tag_id, pg_temp.fake_value(r.kind, r.tag_code, r.tag_id, s.ts)
FROM (
  SELECT generate_series(
    date_trunc('day', (now() AT TIME ZONE 'Asia/Ho_Chi_Minh') - interval '2 days')
      AT TIME ZONE 'Asia/Ho_Chi_Minh',
    date_trunc('hour', now()) + interval '30 minutes',
    interval '30 minutes'
  ) AS ts
) s
CROSS JOIN tmp_seed_tags r;

-- ========== history_1m: 24 giờ, mỗi 1 phút ==========
INSERT INTO public.history_1m ("Time", "TagId", "Value")
SELECT s.ts, r.tag_id, pg_temp.fake_value(r.kind, r.tag_code, r.tag_id, s.ts)
FROM (
  SELECT generate_series(
    now() - interval '24 hours',
    now(),
    interval '1 minute'
  ) AS ts
) s
CROSS JOIN tmp_seed_tags r;

-- ========== history_1s: 30 phút gần nhất, mỗi 5 giây (đủ chart realtime) ==========
INSERT INTO public.history_1s ("Time", "TagId", "Value")
SELECT s.ts, r.tag_id, pg_temp.fake_value(r.kind, r.tag_code, r.tag_id, s.ts)
FROM (
  SELECT generate_series(
    now() - interval '30 minutes',
    now(),
    interval '5 seconds'
  ) AS ts
) s
CROSS JOIN tmp_seed_tags r;

COMMIT;

-- Kiểm tra
SELECT 'history_1s'  AS tbl, COUNT(*) AS rows, COUNT(DISTINCT "TagId") AS tags, MIN("Time") AS min_t, MAX("Time") AS max_t FROM public.history_1s
UNION ALL
SELECT 'history_1m',  COUNT(*), COUNT(DISTINCT "TagId"), MIN("Time"), MAX("Time") FROM public.history_1m
UNION ALL
SELECT 'history_30m', COUNT(*), COUNT(DISTINCT "TagId"), MIN("Time"), MAX("Time") FROM public.history_30m;
