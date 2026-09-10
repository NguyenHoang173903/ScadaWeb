import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/common/Badge'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import {
  EventFilterBar,
  type EventFilterValues,
} from '@/components/common/EventFilterBar'
import { Pagination } from '@/components/common/Pagination'
import { TabNav } from '@/components/common/TabNav'
import { fetchLoginHistory } from '@/services/auditLog'
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
  const [activeTab, setActiveTab] = useState<HistoryTabId>('status')
  const [draft, setDraft] = useState<EventFilterValues>(DEFAULT_EVENT_FILTER)
  const [applied, setApplied] = useState<EventFilterValues>(DEFAULT_EVENT_FILTER)
  const [page, setPage] = useState(1)
  const [loginRows, setLoginRows] = useState<HistoryEventRow[]>([])
  const [loginLoading, setLoginLoading] = useState(false)

  useEffect(() => {
    if (activeTab !== 'login') return

    let cancelled = false
    setLoginLoading(true)

    void (async () => {
      const result = await fetchLoginHistory({
        from: applied.fromDate || undefined,
        to: applied.toDate || undefined,
        keyword: applied.keyword.trim() || undefined,
      })
      if (cancelled) return
      setLoginRows(result.items.map((item, index) => auditLogToHistoryRow(item, index)))
      setLoginLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [activeTab, applied])

  const sourceRows = activeTab === 'login' ? loginRows : HISTORY_ROWS_BY_TAB[activeTab]

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
      : 'Không có dữ liệu'

  return (
    <div className={styles.page}>
      <div className={styles.tabsWrap}>
        <TabNav
          items={[...HISTORY_TABS]}
          activeId={activeTab}
          onChange={(id) => {
            setActiveTab(id as HistoryTabId)
            setPage(1)
          }}
        />
      </div>

      <EventFilterBar
        values={draft}
        deviceOptions={EVENT_DEVICE_OPTIONS}
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
          console.log('Xuất Excel lịch sử', { tab: activeTab, filter: applied })
        }}
      />

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
              ? 'Nhật ký đăng nhập được ghi khi đăng nhập / đăng xuất'
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
