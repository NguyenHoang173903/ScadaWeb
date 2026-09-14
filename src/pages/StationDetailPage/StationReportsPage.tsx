import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DataTable } from '@/components/common/DataTable'
import { Pagination } from '@/components/common/Pagination'
import {
  ReportFilterBar,
  type ReportFilterValues,
} from '@/components/common/ReportFilterBar'
import { isApiError } from '@/services/api/http'
import {
  getPumpTemperatureReport,
  getReportDevices,
  getWaterLevelReport,
} from '@/services/stations/stationsApi'
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

export function StationReportsPage() {
  const { stationId = '' } = useParams()
  const numericStation = /^\d+$/.test(stationId)
  const [draft, setDraft] = useState<ReportFilterValues>(DEFAULT_REPORT_FILTER)
  const [applied, setApplied] = useState<ReportFilterValues>(DEFAULT_REPORT_FILTER)
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<ReportRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [deviceOptions, setDeviceOptions] = useState(REPORT_DEVICE_OPTIONS)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!numericStation) return
    void getReportDevices(Number(stationId))
      .then((devices) => {
        setDeviceOptions([
          { value: 'water-level', label: 'Mức nước' },
          ...devices.map((d) => ({ value: `pump-${d.id}`, label: d.name })),
          { value: 'input-meter', label: 'Đồng hồ điện đầu vào' },
        ])
      })
      .catch(() => {
        // Keep mock options.
      })
  }, [stationId, numericStation])

  useEffect(() => {
    if (!numericStation) {
      setRows([])
      setTotalCount(0)
      return
    }

    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const common = {
          reportDate: applied.reportDate,
          startTime: applied.startTime,
          endTime: applied.endTime,
          pageNumber: page,
          pageSize: REPORT_PAGE_SIZE,
        }

        if (applied.deviceId === 'water-level') {
          const result = await getWaterLevelReport(Number(stationId), common)
          if (cancelled) return
          setRows(
            (result.items ?? []).map((row, index) => ({
              id: `${row.time}-${index}`,
              time: formatTime(row.time),
              riverLevel: fmt(row.riverLevel),
              dischargeTankLevel: fmt(row.discharge1),
            })),
          )
          setTotalCount(result.totalCount ?? result.items?.length ?? 0)
        } else if (applied.deviceId.startsWith('pump-')) {
          const deviceId = Number(applied.deviceId.replace('pump-', ''))
          const result = await getPumpTemperatureReport(Number(stationId), {
            ...common,
            deviceId: Number.isFinite(deviceId) ? deviceId : undefined,
          })
          if (cancelled) return
          setRows(
            (result.items ?? []).map((row, index) => ({
              id: `${row.time}-${row.deviceId}-${index}`,
              time: formatTime(row.time),
              pump: row.pump,
              tempA: fmt(row.tempA),
              tempB: fmt(row.tempB),
              tempC: fmt(row.tempC),
              bearingBottom: fmt(row.bearingBottom),
              bearingTop: fmt(row.bearingTop),
            })),
          )
          setTotalCount(result.totalCount ?? result.items?.length ?? 0)
        } else {
          if (cancelled) return
          setRows([])
          setTotalCount(0)
        }
        setError('')
      } catch (err) {
        if (cancelled) return
        setRows([])
        setTotalCount(0)
        setError(isApiError(err) ? err.message : 'Không tải được báo cáo.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [stationId, numericStation, applied, page])

  const totalPages = Math.max(1, Math.ceil(totalCount / REPORT_PAGE_SIZE) || 1)
  const currentPage = Math.min(page, totalPages)
  const columns = useMemo(
    () =>
      getReportColumns(
        applied.deviceId.startsWith('pump-') ? 'pump-temp-1' : applied.deviceId,
      ),
    [applied.deviceId],
  )

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
          }
        }}
        onFilter={() => {
          setApplied(draft)
          setPage(1)
        }}
        onReset={() => {
          setDraft(DEFAULT_REPORT_FILTER)
          setApplied(DEFAULT_REPORT_FILTER)
          setPage(1)
        }}
        onExport={() => {
          console.log('Xuất Excel báo cáo', applied)
        }}
      />

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      <div className={styles.tablePanel}>
        <DataTable
          key={applied.deviceId}
          columns={columns}
          data={rows}
          rowKey={(row) => row.id}
          minRows={8}
          totalCount={totalCount}
          emptyText={loading ? 'Đang tải...' : 'Không có dữ liệu'}
          updateHint="Dữ liệu cập nhật 30 phút 1 lần"
          footer={
            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
          }
        />
      </div>
    </div>
  )
}
