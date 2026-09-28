import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { Pagination } from '@/components/common/Pagination'
import {
  ReportFilterBar,
  type ReportFilterValues,
} from '@/components/common/ReportFilterBar'
import { isApiError } from '@/services/api/http'
import { canSessionExportExcel } from '@/settings/session'
import { parsePumpIndex } from '@/services/stations/mappers'
import {
  exportReportTableExcel,
  type StationReportColumnDto,
} from '@/services/stations/stationsApi'
import {
  stationReportDevicesQuery,
  stationReportTableQuery,
} from '@/services/stations/stationQueries'
import {
  DEFAULT_REPORT_FILTER,
  getReportColumns,
  REPORT_DEVICE_OPTIONS,
  REPORT_PAGE_SIZE,
  type ReportRow,
} from './reportsMock'
import styles from './ReportsPage.module.css'

function formatTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function fmt(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return ''
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

type ReportDeviceKind = 'level' | 'pump' | 'meter' | 'other'

function classifyDevice(name: string, code?: string): ReportDeviceKind {
  const hay = `${name} ${code ?? ''}`.toLowerCase()
  if (
    hay.includes('level') ||
    hay.includes('mức') ||
    hay.includes('muc') ||
    hay.includes('sensor')
  ) {
    return 'level'
  }
  if (parsePumpIndex(name, code) != null || /pump\d*/i.test(hay) || hay.includes('bơm') || hay.includes('bom')) {
    return 'pump'
  }
  if (
    hay.includes('meter') ||
    hay.includes('metter') ||
    hay.includes('đồng hồ') ||
    hay.includes('dong ho') ||
    hay.includes('powermeter')
  ) {
    return 'meter'
  }
  return 'other'
}

function columnsFromApi(apiColumns: StationReportColumnDto[]): DataTableColumn<ReportRow>[] {
  return [
    { key: 'time', header: 'Thời gian', width: 120, render: (row) => row.time ?? '' },
    ...apiColumns.map((col) => ({
      key: col.key,
      header: col.header,
      width: 130,
      align: 'center' as const,
      render: (row: ReportRow) => row[col.key] ?? '',
    })),
  ]
}

export function StationReportsPage() {
  const { stationId = '' } = useParams()
  const numericStation = /^\d+$/.test(stationId)
  const stationNumber = numericStation ? Number(stationId) : null
  const [draft, setDraft] = useState<ReportFilterValues>(DEFAULT_REPORT_FILTER)
  const [applied, setApplied] = useState<ReportFilterValues>(DEFAULT_REPORT_FILTER)
  const [page, setPage] = useState(1)
  const [deviceOptions, setDeviceOptions] = useState(REPORT_DEVICE_OPTIONS)
  const [deviceMeta, setDeviceMeta] = useState<
    Array<{ id: number; name: string; kind: ReturnType<typeof classifyDevice> }>
  >([])
  const [error, setError] = useState('')
  const [exportBusy, setExportBusy] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const canExport = canSessionExportExcel()
  const reportDevices = useQuery({
    ...stationReportDevicesQuery(stationNumber ?? 0),
    enabled: stationNumber != null,
  })

  useEffect(() => {
    const devices = reportDevices.data
    if (!devices) return
    const meta = devices.map((d) => ({
      id: d.id,
      name: d.name,
      kind: classifyDevice(d.name),
    }))
    setDeviceMeta(meta)
    setDeviceOptions(
      meta.map((d) => ({
        value: `device-${d.id}`,
        label: d.name,
      })),
    )
    if (meta.length > 0) {
      const preferred =
        meta.find((d) => d.kind === 'level') ??
        meta.find((d) => d.kind === 'pump') ??
        meta[0]
      const nextId = `device-${preferred.id}`
      setDraft((prev) => ({ ...prev, deviceId: nextId }))
      setApplied((prev) => ({ ...prev, deviceId: nextId }))
    }
  }, [reportDevices.data])

  const selectedDeviceId = useMemo(() => {
    if (applied.deviceId.startsWith('device-')) {
      return Number(applied.deviceId.replace('device-', ''))
    }
    return null
  }, [applied.deviceId])

  const selectedKind = useMemo(() => {
    if (selectedDeviceId == null) return null
    return deviceMeta.find((d) => d.id === selectedDeviceId)?.kind ?? 'other'
  }, [deviceMeta, selectedDeviceId])

  const reportTable = useQuery({
    ...stationReportTableQuery(stationNumber ?? 0, {
      deviceId: selectedDeviceId ?? 0,
      reportDate: applied.reportDate,
      startTime: applied.startTime,
      endTime: applied.endTime,
      pageNumber: page,
      pageSize: REPORT_PAGE_SIZE,
      refreshTick,
    }),
    enabled: stationNumber != null && selectedDeviceId != null,
  })
  const dynamicColumns = useMemo(
    () =>
      reportTable.data
        ? columnsFromApi(reportTable.data.columns ?? [])
        : null,
    [reportTable.data],
  )
  const rows = useMemo<ReportRow[]>(
    () =>
      (reportTable.data?.items ?? []).map((row, index) => {
        const values: ReportRow = {
          id: `${row.time}-${index}`,
          time: formatTime(row.time),
        }
        for (const [key, value] of Object.entries(row.values ?? {})) {
          values[key] = fmt(value)
        }
        return values
      }),
    [reportTable.data],
  )
  const totalCount =
    reportTable.data?.totalCount ?? reportTable.data?.items?.length ?? 0
  const queryError = reportTable.error ?? reportDevices.error
  const queryErrorMessage = queryError
    ? isApiError(queryError)
      ? queryError.message
      : 'Không tải được báo cáo.'
    : ''

  const totalPages = Math.max(1, Math.ceil(totalCount / REPORT_PAGE_SIZE) || 1)
  const currentPage = Math.min(page, totalPages)
  const columns = useMemo(() => {
    if (dynamicColumns) return dynamicColumns
    if (selectedKind === 'pump') return getReportColumns('pump-temp-1')
    if (selectedKind === 'meter') return getReportColumns('input-meter')
    return getReportColumns('water-level')
  }, [dynamicColumns, selectedKind])

  const handleExport = async () => {
    if (!canExport) {
      setError('Viewer không được xuất Excel (cần Operator/Admin).')
      return
    }
    if (!numericStation || selectedDeviceId == null || exportBusy) return
    setExportBusy(true)
    setError('')
    try {
      // BE chỉ có /reports/table/export — dùng deviceId đang chọn.
      await exportReportTableExcel(Number(stationId), {
        deviceId: selectedDeviceId,
        reportDate: applied.reportDate,
        startTime: applied.startTime,
        endTime: applied.endTime,
      })
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Không xuất được Excel.')
    } finally {
      setExportBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <ReportFilterBar
        values={draft}
        deviceOptions={deviceOptions}
        onChange={(next) => {
          setDraft(next)
          if (next.deviceId !== draft.deviceId) {
            setApplied((prev) => ({ ...prev, deviceId: next.deviceId }))
            setPage(1)
            setError('')
          }
        }}
        onFilter={() => {
          setApplied(draft)
          setPage(1)
          setError('')
        }}
        onReset={() => {
          setApplied({ ...draft })
          setPage(1)
          setRefreshTick((tick) => tick + 1)
          setError('')
        }}
        onExport={() => void handleExport()}
        exportDisabled={!canExport || exportBusy || selectedDeviceId == null}
      />

      {error || queryErrorMessage ? (
        <p style={{ color: '#b91c1c' }}>{error || queryErrorMessage}</p>
      ) : null}

      <div className={styles.tablePanel}>
        <DataTable
          key={applied.deviceId}
          columns={columns}
          data={rows}
          rowKey={(row) => row.id}
          minRows={8}
          totalCount={totalCount}
          emptyText={reportTable.isPending ? 'Đang tải...' : 'Không có dữ liệu'}
          updateHint="Dữ liệu cập nhật 30 phút 1 lần"
          footer={
            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
          }
        />
      </div>
    </div>
  )
}
