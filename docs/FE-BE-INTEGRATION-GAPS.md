# FE ↔ BE còn thiếu / không khớp — ScadaWeb

> Cập nhật: 2026-09-15  
> Phạm vi: chỉ liệt kê **phần Backend còn thiếu hoặc lệch contract** so với FE đã nối.  
> FE đã tự xử lý: gate role UI, parse `pumpIndex` tạm từ tên, map-layers JWT/URL, export gate Viewer, tab login Admin-only, team empty state, discharge1..10, alarm status/ack, password-policy notice local-only.

---

## Ưu tiên P0

### BE-01 — Expose `pumpIndex` trên device-monitor (và ideally device-cards)

**Vấn đề:** FE lọc nhóm bơm 1–5 / 6–10 theo `pumpIndex`. Hiện BE tính `PumpIndex` nội bộ từ `PumpN` nhưng **không trả** trên `DeviceMonitorItemDto` — chỉ có `deviceId` (PK). FE đang **fallback parse tên** (`Bơm 3`, `Pump3`) — dễ sai nếu tên không chuẩn.

**Đề xuất:**
```json
{
  "deviceId": 27,
  "pumpIndex": 3,
  "name": "Bơm 3",
  "code": "Pump3",
  "status": "running"
}
```
- Thêm `pumpIndex` (int, 1..10) vào `DeviceMonitorItemDto` (+ `device-cards` nếu có).
- Document: UI nhóm / overlay SVG dùng `pumpIndex`, không dùng PK.
- Giữ nhất quán với `SchematicPumpDto.Id` = 1..10.

---

### BE-02 — REST chính sách mật khẩu + login security

**Vấn đề:** FE admin form chỉ lưu localStorage (đã ghi chú rõ). BE validate create/change/reset password theo `PasswordPolicyOptions` / `LoginSecurityOptions` (appsettings). Catalog `fe.passwordPolicy` / `password.*` có `EditableViaApi: false`.

**Đề xuất:**
- `GET /api/v1/password-policy`
- `PUT /api/v1/password-policy` (Admin)
- Persist DB/`app_settings` để đổi runtime không cần restart.

| Field FE | Map BE gợi ý |
|----------|----------------|
| `minLength` / `maxLength` | Complexity |
| `requireUppercase` / `Lowercase` / `Number` / `Special` | Flags |
| `changeIntervalDays` / `validityDays` | `ExpireDays` (+ interval) |
| `maxFailedLogins` | `LoginSecurity.MaxFailed` |
| `failedLoginWindowMinutes` | `WindowMinutes` |
| `loginLockoutMinutes` | `LockMinutes` |
| — | Expose thêm `WarnBeforeDays` |

---

### BE-03 — Login history cho non-Admin (hoặc endpoint riêng)

**Vấn đề:** FE tab Đăng nhập chỉ hiện với Admin (vì `GET /system-audit-logs` = Admin/SuperAdmin). Operator không xem được lịch sử đăng nhập.

**Đề xuất (chọn 1):**
1. `GET /api/v1/auth/login-history` — user đã login xem event Authentication (của mình hoặc toàn hệ thống theo policy); hoặc
2. Nới authorize trên `system-audit-logs` khi `eventType=Authentication`; hoặc
3. Non-Admin chỉ xem log của chính mình.

---

### BE-04 — Tổ vận hành / ca kíp

**Đã tích hợp:** FE gọi endpoint hiện có:
```
GET /api/v1/stations/{stationId}/team
```
Nguồn: Redis `SCADA:{stationCode}:OPERATOR:*`; yêu cầu quyền `Realtime.View`.
Response gồm `employeeCode`, `fullName`, `position`, `dateOfBirth`,
`educationLevel`, `phone`, `shiftStartTime`. FE map sang card và refresh mỗi 15 giây.

CRUD nhân sự/ca kíp lưu PostgreSQL vẫn là hạng mục tùy chọn sau.

---

## Ưu tiên P1

### BE-05 — `StationReportDeviceOptionDto` thiếu `code` / `deviceType` / `kind`

**Vấn đề:** BE dropdown chỉ `{ id, name }`. FE phải heuristic tên để chọn `water-levels` / `pump-temperatures` / `reports/table` → rủi ro sai endpoint.

**Đề xuất thêm field:**
```json
{ "id": 12, "name": "Đồng hồ đầu vào", "code": "Meter1", "deviceType": "PowerMeter", "kind": "meter" }
```
`kind`: `level` | `pump` | `meter` | `other` (server quyết định giống logic GetReportDeviceOptions hiện tại).

---

### BE-06 — Export Excel riêng cho water-levels / pump-temperatures

**Vấn đề:** FE luôn gọi `GET .../reports/table/export` (API duy nhất). Khi UI đang xem `water-levels` hoặc `pump-temperatures`, file Excel có thể lệch nguồn (history_30m vs endpoint báo cáo chuyên biệt).

**Đề xuất:**
- `GET .../reports/water-levels/export`
- `GET .../reports/pump-temperatures/export`  
cùng query với GET tương ứng; **hoặc** document rõ table/export là SoT cho mọi loại thiết bị và FE chuyển hẳn sang `reports/table` để hiển thị.

---

### BE-07 — `ScadaUserDto` thiếu profile fields khi Sửa

**Vấn đề:** `UpdateScadaUserRequest` nhận `description`, `email`, `unit` nhưng `ScadaUserDto` **không trả** → form Sửa không hydrate được mô tả/email/đơn vị. FE đã **không gửi** `description` rỗng để tránh ghi đè.

**Đề xuất thêm vào `ScadaUserDto`:** `description`, `email`, `unit` (và ideally khớp Create response).

---

### BE-08 — Mở rộng Station update (nếu product cần form dài + ảnh)

**Hiện tại:** `PUT /stations/{id}` đủ `Name`, `Address`, `Latitude`, `Longitude`, `Description`, `IsActive` — FE đã thu hẹp form theo contract này.

**Nếu product cần lại:** đơn vị QL, nhiệm vụ, phân loại, năm XD, thiết bị bơm, upload ảnh → thêm cột entity + `POST .../image` (multipart). Nếu **won't fix**: xác nhận FE giữ form metadata tối giản.

---

## Ưu tiên P2 / tùy chọn

### BE-09 — Alarm ack/clear từ màn lỗi hiện hữu

FE đã nối `GET .../alarms/active` (+ export). Có thể bổ sung nút FE sau nếu BE expose:
- `POST /alarm-histories/{id}/acknowledge`
- `POST /alarm-histories/{id}/clear`  
(đã có controller history — cần confirm scope theo `stationId` và document cho FE.)

### BE-10 — Electrical `isPrimary` / role

FE schematic điện lấy `items[0]`. Nên document thiết bị đầu vào luôn đứng đầu **hoặc** thêm `role: "incoming-meter"` / `isPrimary`.

### BE-11 — Process / mực nước realtime trên sơ đồ công nghệ

FE còn hardcode một phần mực nước trên process. Đề xuất tag mức sông/bể trong snapshot `cong-nghe` hoặc field trên schematic DTO.

---

## Không cần BE làm (FE đã xử lý)

| Hạng mục | Cách FE xử lý |
|----------|----------------|
| Filter bơm 1–5 / 6–10 khi chưa có `pumpIndex` | Parse tạm từ `name`/`code` |
| Map-layers download 401 / double `/api/v1` | Gắn Bearer + resolve URL qua origin / path relative |
| Map layer client id | `crypto.randomUUID()` |
| Viewer bấm Xuất Excel | Disable nút + message |
| Operator xem tab Đăng nhập | Ẩn tab nếu không Admin |
| Team mock giả | Empty state chờ API |
| Password policy UI | Notice local-only |
| Cập nhật trạm / scada-users mutate | Gate Admin trên UI |
| `discharge2..10` | Map đủ cột trên báo cáo mức nước |
| Alarm `endedAt` trống | Đổi cột “Trạng thái = Đang mở” + “Xác nhận” |

---

## Liên hệ FE

- Base URL: `runtimeConfig` / `.env` — ví dụ `http://localhost:5140/api/v1`
- Map layers server: `VITE_MAP_LAYER_STORAGE=api`
- Envelope: `ApiResponse<T>`; Excel = file stream
- Hub: `/hubs/scada` + JWT
