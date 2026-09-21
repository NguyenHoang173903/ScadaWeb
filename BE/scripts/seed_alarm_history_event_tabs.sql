-- Fake alarm_history cho 3 tab lịch sử sự kiện (station 1 / TBAB).
-- Tab Đăng nhập lấy system-audit-logs — không seed ở đây.
--
-- category BE:
--   status       → EventTypeId IN (1,2,7) hoặc Type ERROR/ALARM/WARNING/FAULT
--   value-change → EventTypeId IN (4,5)   hoặc Type START/STOP/PUMP/INFO
--   system       → EventTypeId = 6        hoặc Type SYSTEM/Communication/EVENT
--
-- Chạy:
--   $env:PGPASSWORD='123456'
--   & 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h 100.99.230.105 -U postgres -d scada_tlhn -f BE/scripts/seed_alarm_history_event_tabs.sql

BEGIN;

DELETE FROM public.alarm_history WHERE "StationId" = 1;

-- ========== TAB: Lỗi/Trạng thái (status) ==========
WITH fault_tags AS (
  SELECT
    t."Id" AS tag_id,
    t."Code" AS tag_code,
    d."Id" AS device_id,
    COALESCE(NULLIF(d."Name", ''), d."Code") AS device_name,
    p."Id" AS plc_id,
    p."StationId" AS station_id,
    row_number() OVER (ORDER BY d."Code", t."Id") AS rn
  FROM public."Tag" t
  JOIN public."Device" d ON d."Id" = t."DeviceId"
  JOIN public."PLC" p ON p."Id" = d."PlcId"
  WHERE p."StationId" = 1
    AND d."Code" ~ '^Pump([1-9]|10)$'
    AND (
      upper(t."Code") LIKE '%FAULT%'
      OR upper(t."Code") LIKE '%TEMP%'
      OR upper(t."Code") IN ('I1', 'I2', 'I3')
    )
),
slots AS (
  SELECT generate_series(0, 119) AS i
)
INSERT INTO public.alarm_history (
  "StationId", "PlcId", "DeviceId", "TagId",
  "TagEventConfigId", "EventTypeId", "TriggerTypeId",
  "DeviceName", "TagName", "Description", "TroubleshootingGuide",
  "Type", "IsAcknowledged", "DurationSeconds",
  "StartTime", "EndTime", "CreatedAt"
)
SELECT
  f.station_id,
  f.plc_id,
  f.device_id,
  f.tag_id,
  20 + (s.i % 5),
  CASE
    WHEN s.i % 5 = 0 THEN 2
    WHEN s.i % 3 = 0 THEN 1
    ELSE 7
  END,
  1,
  f.device_name,
  f.device_name || '_' || f.tag_code,
  CASE
    WHEN upper(f.tag_code) LIKE '%TEMP%' THEN 'Nhiệt độ vượt ngưỡng — ' || f.device_name
    WHEN upper(f.tag_code) IN ('I1', 'I2', 'I3') THEN 'Dòng điện vượt ngưỡng — ' || f.device_name
    WHEN upper(f.tag_code) LIKE '%FAULT%' THEN 'Lỗi thiết bị — ' || f.device_name
    ELSE 'Cảnh báo trạng thái — ' || f.device_name
  END,
  'Kiểm tra tải, làm mát và tín hiệu phản hồi.',
  CASE
    WHEN s.i % 5 = 0 THEN 'WARNING'
    WHEN s.i % 3 = 0 THEN 'ALARM'
    ELSE 'ERROR'
  END,
  (s.i % 4 = 0),
  EXTRACT(EPOCH FROM (interval '30 minutes' + (s.i % 6) * interval '15 minutes')),
  (
    date_trunc('day', (now() AT TIME ZONE 'Asia/Ho_Chi_Minh') - ((s.i % 30) || ' days')::interval)
    + time '07:15:00'
    + (s.i % 10) * interval '75 minutes'
  ) AT TIME ZONE 'Asia/Ho_Chi_Minh',
  CASE
    WHEN s.i % 7 = 0 THEN NULL
    ELSE (
      date_trunc('day', (now() AT TIME ZONE 'Asia/Ho_Chi_Minh') - ((s.i % 30) || ' days')::interval)
      + time '10:00:00'
      + (s.i % 10) * interval '75 minutes'
    ) AT TIME ZONE 'Asia/Ho_Chi_Minh'
  END,
  now()
FROM slots s
JOIN fault_tags f ON f.rn = (s.i % GREATEST((SELECT COUNT(*) FROM fault_tags), 1)) + 1
WHERE (SELECT COUNT(*) FROM fault_tags) > 0;

-- ========== TAB: Giá trị thay đổi (value-change) ==========
WITH run_tags AS (
  SELECT
    t."Id" AS tag_id,
    t."Code" AS tag_code,
    d."Id" AS device_id,
    COALESCE(NULLIF(d."Name", ''), d."Code") AS device_name,
    p."Id" AS plc_id,
    p."StationId" AS station_id,
    row_number() OVER (ORDER BY d."Code", t."Id") AS rn
  FROM public."Tag" t
  JOIN public."Device" d ON d."Id" = t."DeviceId"
  JOIN public."PLC" p ON p."Id" = d."PlcId"
  WHERE p."StationId" = 1
    AND d."Code" ~ '^Pump([1-9]|10)$'
    AND upper(t."Code") IN ('FB_RUN', 'CTRL_RUN_PUMP', 'FB_STOP', 'FB_TEMP_PHASEA', 'I1')
),
slots AS (
  SELECT generate_series(0, 89) AS i
)
INSERT INTO public.alarm_history (
  "StationId", "PlcId", "DeviceId", "TagId",
  "EventTypeId", "DeviceName", "TagName", "Description",
  "Type", "IsAcknowledged", "DurationSeconds",
  "StartTime", "EndTime", "CreatedAt"
)
SELECT
  f.station_id,
  f.plc_id,
  f.device_id,
  f.tag_id,
  CASE
    WHEN s.i % 4 = 0 THEN 4
    WHEN s.i % 4 = 1 THEN 5
    ELSE 4
  END,
  f.device_name,
  f.tag_code,
  CASE
    WHEN s.i % 4 = 0 THEN 'Khởi động ' || f.device_name || ' (0 → 1)'
    WHEN s.i % 4 = 1 THEN 'Dừng ' || f.device_name || ' (1 → 0)'
    WHEN s.i % 4 = 2 THEN 'Giá trị ' || f.tag_code || ' thay đổi trên ' || f.device_name
    ELSE 'Cập nhật thông số vận hành ' || f.device_name
  END,
  CASE
    WHEN s.i % 4 = 0 THEN 'START'
    WHEN s.i % 4 = 1 THEN 'STOP'
    WHEN s.i % 4 = 2 THEN 'INFO'
    ELSE 'PUMP'
  END,
  true,
  30 + (s.i % 20),
  (
    date_trunc('day', (now() AT TIME ZONE 'Asia/Ho_Chi_Minh') - ((s.i % 30) || ' days')::interval)
    + time '06:00:00'
    + (s.i % 12) * interval '80 minutes'
  ) AT TIME ZONE 'Asia/Ho_Chi_Minh',
  (
    date_trunc('day', (now() AT TIME ZONE 'Asia/Ho_Chi_Minh') - ((s.i % 30) || ' days')::interval)
    + time '06:05:00'
    + (s.i % 12) * interval '80 minutes'
  ) AT TIME ZONE 'Asia/Ho_Chi_Minh',
  now()
FROM slots s
JOIN run_tags f ON f.rn = (s.i % GREATEST((SELECT COUNT(*) FROM run_tags), 1)) + 1
WHERE (SELECT COUNT(*) FROM run_tags) > 0;

-- ========== TAB: Hệ thống (system) ==========
INSERT INTO public.alarm_history (
  "StationId", "PlcId", "DeviceId", "TagId",
  "EventTypeId", "DeviceName", "TagName", "Description",
  "Type", "IsAcknowledged", "DurationSeconds",
  "StartTime", "EndTime", "CreatedAt"
)
SELECT
  1,
  1,
  NULL,
  NULL,
  6,
  CASE WHEN g % 3 = 0 THEN 'PLC1' ELSE NULL END,
  CASE WHEN g % 3 = 0 THEN 'Comm_Status' ELSE NULL END,
  CASE
    WHEN g % 4 = 0 THEN 'Mất kết nối PLC tạm thời — tự khôi phục'
    WHEN g % 4 = 1 THEN 'Đồng bộ cấu hình tag từ máy chủ'
    WHEN g % 4 = 2 THEN 'Dịch vụ realtime khởi động lại'
    ELSE 'Sự kiện hệ thống #' || g
  END,
  CASE
    WHEN g % 3 = 0 THEN 'Communication'
    WHEN g % 3 = 1 THEN 'SYSTEM'
    ELSE 'EVENT'
  END,
  true,
  NULL,
  (
    date_trunc('day', (now() AT TIME ZONE 'Asia/Ho_Chi_Minh') - ((g % 30) || ' days')::interval)
    + time '00:30:00'
    + (g % 20) * interval '55 minutes'
  ) AT TIME ZONE 'Asia/Ho_Chi_Minh',
  NULL,
  now()
FROM generate_series(1, 60) g;

COMMIT;

SELECT 'by_type' AS kind, "Type", COUNT(*)::text AS cnt FROM public.alarm_history WHERE "StationId" = 1 GROUP BY "Type"
UNION ALL
SELECT 'total', 'ALL', COUNT(*)::text FROM public.alarm_history WHERE "StationId" = 1
ORDER BY 1, 2;

SELECT
  CASE
    WHEN "EventTypeId" IN (1, 2, 7) OR "Type" IN ('ERROR', 'ALARM', 'WARNING', 'FAULT') THEN 'status'
    WHEN "EventTypeId" IN (4, 5) OR "Type" IN ('START', 'STOP', 'PUMP', 'INFO') THEN 'value-change'
    WHEN "EventTypeId" = 6 OR "Type" IN ('SYSTEM', 'Communication', 'EVENT') THEN 'system'
    ELSE 'other'
  END AS tab,
  COUNT(*) AS cnt
FROM public.alarm_history
WHERE "StationId" = 1
GROUP BY 1
ORDER BY 1;
