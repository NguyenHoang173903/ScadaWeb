# Seed demo Redis ALARM + OPERATOR cho TBAB (RealtimeRedis).
# Chạy trong PowerShell:
#   powershell -File BE/scripts/seed_redis_alarm_operator.ps1

$ErrorActionPreference = 'Stop'
$cli = Get-Command redis-cli -ErrorAction SilentlyContinue
if (-not $cli) {
  $cliPath = Get-ChildItem -Path "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Filter redis-cli.exe -Recurse -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName
  if (-not $cliPath) { throw 'redis-cli not found' }
} else {
  $cliPath = $cli.Source
}

$hostName = if ($env:REDIS_HOST) { $env:REDIS_HOST } else { '100.99.230.105' }
$port = if ($env:REDIS_PORT) { $env:REDIS_PORT } else { '6379' }
$dir = Join-Path $PSScriptRoot '_redis_seed_tmp'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$utf8 = New-Object System.Text.UTF8Encoding $false

$pairs = @{
  'SCADA:TBAB:ALARM:500001' = '{"Id":500001,"StartTime":"2026-09-12T20:01:00+07:00","DeviceName":"Pump 01","TagName":"Pump01_Temp","TagId":560,"DeviceId":1,"Type":"HIGH","TagEventConfigId":25,"EventTypeId":1,"Description":"Nhiệt độ bơm vượt ngưỡng cho phép","TroubleshootingGuide":"Kiểm tra hệ thống làm mát và tải của bơm","State":"ACTIVE","Severity":"HIGH","Value":85.5,"Acknowledged":false,"AcknowledgedBy":null,"AcknowledgedAt":null,"EndTime":null}'
  'SCADA:TBAB:ALARM:500002' = '{"Id":500002,"StartTime":"2026-09-21T18:30:00+07:00","DeviceName":"Bơm 2","TagName":"Pump02_Temp","TagId":561,"DeviceId":2,"Type":"WARNING","TagEventConfigId":26,"EventTypeId":1,"Description":"Dòng điện vượt mức cảnh báo","TroubleshootingGuide":"Kiểm tra tải và pha","State":"ACTIVE","Severity":"WARNING","Value":120.2,"Acknowledged":false,"AcknowledgedBy":null,"AcknowledgedAt":null,"EndTime":null}'
  'SCADA:TBAB:OPERATOR:1001' = '{"ID":1001,"HoTen":"Nguyễn Văn B","NgaySinh":"1985-05-10","ChucVu":"Nhân viên vận hành","TrinhDo":"Đại học","MaNhanVien":"NV001","DienThoai":"0900000000","ThoiGianNhanCa":"2026-09-13T06:00:00+07:00"}'
  'SCADA:TBAB:OPERATOR:1002' = '{"ID":1002,"HoTen":"Trần Thị C","NgaySinh":"1990-11-20","ChucVu":"Tổ trưởng ca","TrinhDo":"Cao đẳng","MaNhanVien":"NV002","DienThoai":"0911111111","ThoiGianNhanCa":"2026-09-21T14:00:00+07:00"}'
}

$i = 0
foreach ($kv in $pairs.GetEnumerator()) {
  $i++
  $file = Join-Path $dir "payload_$i.json"
  [IO.File]::WriteAllText($file, $kv.Value, $utf8)
  cmd /c "type `"$file`" | `"$cliPath`" -h $hostName -p $port -x SET $($kv.Key)" | Out-Host
}

Remove-Item -Recurse -Force $dir
Write-Host "Seeded $($pairs.Count) keys on ${hostName}:$port"
