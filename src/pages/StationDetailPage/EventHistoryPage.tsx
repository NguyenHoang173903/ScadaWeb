import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import {
  EventFilterBar,
  type EventFilterValues,
} from '@/components/common/EventFilterBar'
import { Pagination } from '@/components/common/Pagination'
import { TabNav } from '@/components/common/TabNav'
import { fetchLoginHistory } from '@/services/auditLog'
import { isApiError } from '@/services/api/http'
import { canSessionExportExcel, isSessionAdmin } from '@/settings/session'
import {
  exportEventHistoryExcel,
  getEventDevices,
  getEventHistory,
} from '@/services/stations/stationsApi'
import {
  DEFAULT_EVENT_FILTER,
  EVENT_DEVICE_OPTIONS,
  EVENT_PAGE_SIZE,
  HISTORY_ROWS_BY_TAB,
  HISTORY_TABS,
  auditLogToHistoryRow,
  getHistoryBadgeTone,
  type HistoryEventRow,
  type HistoryTabId,
} from './eventsMock'
import styles from './EventsPage.module.css'

const HISTORY_COLUMNS: DataTableColumn<HistoryEventRow>[] = [
  {
    key: 'stt',
    header: 'STT',
    width: 64,
    align: 'center',
    render: (row) => row.stt,
  },
  {
    key: 'time',
    header: 'Thời gian',
    width: 200,
    render: (row) => <span className={styles.cellText}>{row.time}</span>,
  },
  {
    key: 'type',
    header: 'Loại',
    width: 150,
    align: 'center',
    render: (row) => (
      <span className={styles.badgeCell}>
        <Badge tone={getHistoryBadgeTone(row.type)}>{row.type}</Badge>
      </span>
    ),
  },
  {
    key: 'title',
    header: 'Tiêu đề',
    width: 200,
    render: (row) => <span className={styles.cellText}>{row.title}</span>,
  },
  {
    key: 'detail',
    header: 'Mô tả chi tiết',
    width: 280,
    render: (row) => <span className={styles.cellText}>{row.detail || ''}</span>,
  },
  {
    key: 'device',
    header: 'Thiết bị',
    width: 110,
    render: (row) => <span className={styles.cellText}>{row.device}</span>,
  },
  {
    key: 'tag',
    header: 'Tag',
    width: 180,
    render: (row) => <span className={styles.cellText}>{row.tag}</span>,
  },
  {
    key: 'user',
    header: 'Người dùng',
    width: 110,
    render: (row) => <span className={styles.cellText}>{row.user || ''}</span>,
  },
  {
    key: 'endedAt',
    header: 'Kết thúc',
    width: 200,
    render: (row) => <span className={styles.cellText}>{row.endedAt}</span>,
  },
]

function localHistoryDay(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function inDateRange(isoDay: string | undefined, fromDate: string, toDate: string) {
  if (!isoDay) return true
  if (fromDate && isoDay < fromDate) return false
  if (toDate && isoDay > toDate) return false
  return true
}

function filterHistoryRows(rows: HistoryEventRow[], filter: EventFilterValues) {
  const keyword = filter.keyword.trim().toLowerCase()

  return rows.filter((row) => {
    if (filter.deviceId !== 'all' && row.deviceId !== filter.deviceId) return false
    if (row.occurredAt && !inDateRange(localHistoryDay(row.occurredAt), filter.fromDate, filter.toDate)) {
      return false
    }
    if (!keyword) return true
    return [row.time, row.type, row.title, row.detail, row.device, row.tag, row.user, row.endedAt]
      .join(' ')
      .toLowerCase()
      .includes(keyword)
  })
}

export function EventHistoryPage() {
  const { stationId = '' } = useParams()
  const numericStation = /^\d+$/.test(stationId)
  const [activeTab, setActiveTab] = useState<HistoryTabId>('status')
  const [draft, setDraft] = useState<EventFilterValues>(DEFAULT_EVENT_FILTER)
  const [applied, setApplied] = useState<EventFilterValues>(DEFAULT_EVENT_FILTER)
  const [page, setPage] = useState(1)
  const [apiRows, setApiRows] = useState<HistoryEventRow[]>([])
  const [loginRows, setLoginRows] = useState<HistoryEventRow[]>([])
  const [loginLoading, setLoginLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exportError, setExportError] = useState('')
  const [exportBusy, setExportBusy] = useState(false)
  const [deviceOptions, setDeviceOptions] = useState(EVENT_DEVICE_OPTIONS)
  const canExport = canSessionExportExcel()
  const showLoginTab = isSessionAdmin()

  const historyTabs = useMemo(
    () => (showLoginTab ? [...HISTORY_TABS] : HISTORY_TABS.filter((t) => t.id !== 'login')),
    [showLoginTab],
  )

  useEffect(() => {
    if (!numericStation) return
    void getEventDevices(Number(stationId))
      .then((devices) => {
        setDeviceOptions([
          { value: 'all', label: 'Thiết bị' },
          ...devices.map((d) => ({ value: `device-${d.id}`, label: d.name })),
        ])
      })
      .catch(() => {
        // Keep mock options.
      })
  }, [stationId, numericStation])

  useEffect(() => {
    if (activeTab === 'login') return
    if (!numericStation) {
      setApiRows(HISTORY_ROWS_BY_TAB[activeTab])
      return
    }

    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const deviceId =
          applied.deviceId.startsWith('device-')
            ? Number(applied.deviceId.replace('device-', ''))
            : undefined
        const result = await getEventHistory(Number(stationId), {
          category: activeTab,
          deviceId: Number.isFinite(deviceId) ? deviceId : undefined,
          fromDate: applied.fromDate || undefined,
          toDate: applied.toDate || undefined,
          keyword: applied.keyword.trim() || undefined,
          pageNumber: 1,
          pageSize: 500,
        })
        if (cancelled) return
        setApiRows(
          (result.items ?? []).map((row, index) => ({
            id: String(row.id),
            stt: index + 1,
            time: new Date(row.startTime).toLocaleString('vi-VN'),
            type: (['ERROR', 'INFO', 'WARNING', 'PUMP', 'Communication', 'Security'].includes(
              row.type,
            )
              ? row.type
              : 'INFO') as HistoryEventRow['type'],
            title: row.title,
            detail: row.description || '',
            device: row.deviceName || '',
            deviceId: row.deviceId != null ? `device-${row.deviceId}` : 'all',
            tag: row.tagName || '',
            user: row.username || '',
            endedAt: row.endTime ? new Date(row.endTime).toLocaleString('vi-VN') : '',
            occurredAt: row.startTime,
          })),
        )
      } catch {
        if (!cancelled) setApiRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [activeTab, applied, stationId, numericStation])

  useEffect(() => {
    if (activeTab !== 'login') return
    if (!showLoginTab) {
      setActiveTab('status')
      return
    }

    let cancelled = false
    setLoginLoading(true)

    void (async () => {
      try {
        const result = await fetchLoginHistory({
          from: applied.fromDate || undefined,
          to: applied.toDate || undefined,
          keyword: applied.keyword.trim() || undefined,
        })
        if (cancelled) return
        setLoginRows(result.items.map((item, index) => auditLogToHistoryRow(item, index)))
      } catch (err) {
        if (!cancelled) {
          setLoginRows([])
          setExportError(
            isApiError(err) && err.status === 403
              ? 'Chỉ Admin được xem nhật ký đăng nhập.'
              : isApiError(err)
                ? err.message
                : 'Không tải được nhật ký đăng nhập.',
          )
        }
      } finally {
        if (!cancelled) setLoginLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [activeTab, applied, showLoginTab])

  const sourceRows = activeTab === 'login' ? loginRows : apiRows

  const filteredRows = useMemo(
    () => filterHistoryRows(sourceRows, applied),
    [sourceRows, applied],
  )

  const totalRecords = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / EVENT_PAGE_SIZE) || 1)
  const currentPage = Math.min(page, totalPages)
  const pageRows = filteredRows
    .slice((currentPage - 1) * EVENT_PAGE_SIZE, currentPage * EVENT_PAGE_SIZE)
    .map((row, index) => ({
      ...row,
      stt: (currentPage - 1) * EVENT_PAGE_SIZE + index + 1,
    }))

  const emptyText =
    activeTab === 'login'
      ? loginLoading
        ? 'Đang tải nhật ký đăng nhập...'
        : 'Chưa có sự kiện đăng nhập'
      : loading
        ? 'Đang tải...'
        : 'Không có dữ liệu'

  return (
    <div className={styles.page}>
      <div className={styles.tabsWrap}>
        <TabNav
          items={historyTabs}
          activeId={activeTab}
          onChange={(id) => {
            setActiveTab(id as HistoryTabId)
            setPage(1)
            setExportError('')
          }}
        />
      </div>

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
        exportDisabled={!canExport || exportBusy || activeTab === 'login'}
        onExport={() => {
          if (activeTab === 'login') {
            setExportError('Xuất Excel tab Đăng nhập chưa có API riêng.')
            return
          }
          if (!canExport) {
            setExportError('Viewer không được xuất Excel (cần Operator/Admin).')
            return
          }
          if (!numericStation || exportBusy) return
          void (async () => {
            setExportBusy(true)
            setExportError('')
            try {
              const deviceId =
                applied.deviceId.startsWith('device-')
                  ? Number(applied.deviceId.replace('device-', ''))
                  : undefined
              await exportEventHistoryExcel(Number(stationId), {
                category: activeTab,
                deviceId: Number.isFinite(deviceId) ? deviceId : undefined,
                fromDate: applied.fromDate || undefined,
                toDate: applied.toDate || undefined,
                keyword: applied.keyword.trim() || undefined,
              })
            } catch (err) {
              setExportError(isApiError(err) ? err.message : 'Không xuất được Excel.')
            } finally {
              setExportBusy(false)
            }
          })()
        }}
      />

      {exportError ? <p style={{ color: '#b91c1c' }}>{exportError}</p> : null}

      <div className={styles.tablePanel}>
        <DataTable
          key={activeTab}
          columns={HISTORY_COLUMNS}
          data={pageRows}
          rowKey={(row) => row.id}
          minRows={8}
          totalCount={totalRecords}
          emptyText={emptyText}
          updateHint={
            activeTab === 'login'
              ? 'Nhật ký đăng nhập đồng bộ từ system-audit-logs'
              : 'Dữ liệu cập nhật 30 phút 1 lần'
          }
          footer={
            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
          }
        />
      </div>
    </div>
  )
}
