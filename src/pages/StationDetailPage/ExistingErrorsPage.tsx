import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DataTable } from '@/components/common/DataTable'
import {
  EventFilterBar,
  type EventFilterValues,
} from '@/components/common/EventFilterBar'
import { Pagination } from '@/components/common/Pagination'
import { isApiError } from '@/services/api/http'
import { useScadaRealtime } from '@/services/realtime'
import { canSessionExportExcel } from '@/settings/session'
import {
  exportActiveAlarmsExcel,
  getActiveAlarms,
  getEventDevices,
} from '@/services/stations/stationsApi'
import {
  DEFAULT_EVENT_FILTER,
  EVENT_DEVICE_OPTIONS,
  EVENT_PAGE_SIZE,
  EXISTING_ERROR_COLUMNS,
  type ExistingErrorRow,
} from './eventsMock'
import styles from './EventsPage.module.css'

function formatDateTime(iso?: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

export function ExistingErrorsPage() {
  const { stationId = '' } = useParams()
  const numericStation = /^\d+$/.test(stationId)
  const [draft, setDraft] = useState<EventFilterValues>(DEFAULT_EVENT_FILTER)
  const [applied, setApplied] = useState<EventFilterValues>(DEFAULT_EVENT_FILTER)
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<ExistingErrorRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [deviceOptions, setDeviceOptions] = useState(EVENT_DEVICE_OPTIONS)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [exportBusy, setExportBusy] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const canExport = canSessionExportExcel()

  useScadaRealtime({
    stationId,
    screen: 'loi',
    enabled: numericStation,
    onInvalidate: () => setRefreshTick((n) => n + 1),
  })

  useEffect(() => {
    if (!numericStation) return
    void getEventDevices(Number(stationId))
      .then((devices) => {
        setDeviceOptions([
          { value: 'all', label: 'Thiết bị' },
          ...devices.map((d) => ({ value: String(d.id), label: d.name })),
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
        const deviceId =
          applied.deviceId !== 'all' && /^\d+$/.test(applied.deviceId)
            ? Number(applied.deviceId)
            : undefined
        const result = await getActiveAlarms(Number(stationId), {
          deviceId,
          keyword: applied.keyword.trim() || undefined,
          pageNumber: page,
          pageSize: EVENT_PAGE_SIZE,
        })
        if (cancelled) return
        setRows(
          (result.items ?? []).map((row, index) => ({
            id: String(row.id),
            stt: (page - 1) * EVENT_PAGE_SIZE + index + 1,
            device: row.deviceName || '—',
            description: row.description || row.title,
            type: row.type,
            startedAt: formatDateTime(row.startTime),
            status: 'Đang mở',
            acknowledged: row.isAcknowledged ? 'Đã xác nhận' : 'Chưa',
          })),
        )
        setTotalCount(result.totalCount ?? result.items?.length ?? 0)
        setError('')
      } catch (err) {
        if (cancelled) return
        setRows([])
        setTotalCount(0)
        setError(isApiError(err) ? err.message : 'Không tải được sự kiện.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [stationId, numericStation, applied, page, refreshTick])

  const totalPages = Math.max(1, Math.ceil(totalCount / EVENT_PAGE_SIZE) || 1)
  const currentPage = Math.min(page, totalPages)

  const pageRows = useMemo(
    () =>
      rows.map((row, index) => ({
        ...row,
        stt: (currentPage - 1) * EVENT_PAGE_SIZE + index + 1,
      })),
    [rows, currentPage],
  )

  return (
    <div className={styles.page}>
      <EventFilterBar
        values={draft}
        deviceOptions={deviceOptions}
        onChange={setDraft}
        onFilter={() => {
          setApplied(draft)
          setPage(1)
        }}
        onReset={() => {
          setDraft(DEFAULT_EVENT_FILTER)
          setApplied(DEFAULT_EVENT_FILTER)
          setPage(1)
        }}
        onExport={() => {
          if (!canExport) {
            setError('Viewer không được xuất Excel (cần Operator/Admin).')
            return
          }
          if (!numericStation || exportBusy) return
          void (async () => {
            setExportBusy(true)
            setError('')
            try {
              const deviceId =
                applied.deviceId !== 'all' && /^\d+$/.test(applied.deviceId)
                  ? Number(applied.deviceId)
                  : undefined
              await exportActiveAlarmsExcel(Number(stationId), {
                deviceId,
                keyword: applied.keyword.trim() || undefined,
              })
            } catch (err) {
              setError(isApiError(err) ? err.message : 'Không xuất được Excel.')
            } finally {
              setExportBusy(false)
            }
          })()
        }}
        exportDisabled={!canExport || exportBusy}
      />

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      <div className={styles.tablePanel}>
        <DataTable
          columns={EXISTING_ERROR_COLUMNS}
          data={pageRows}
          rowKey={(row) => row.id}
          minRows={8}
          totalCount={totalCount}
          emptyText={loading ? 'Đang tải...' : 'Không có dữ liệu'}
          footer={
            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
          }
        />
      </div>
    </div>
  )
}
