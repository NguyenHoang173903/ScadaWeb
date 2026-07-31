import { useMemo, useState } from 'react'
import { DataTable } from '@/components/common/DataTable'
import {
  EventFilterBar,
  type EventFilterValues,
} from '@/components/common/EventFilterBar'
import { Pagination } from '@/components/common/Pagination'
import {
  DEFAULT_EVENT_FILTER,
  EVENT_DEVICE_OPTIONS,
  OPERATION_LOG_COLUMNS,
  OPERATION_LOG_PAGE_SIZE,
  OPERATION_LOG_ROWS,
} from './eventsMock'
import styles from './EventsPage.module.css'

function filterOperationLogs(
  rows: typeof OPERATION_LOG_ROWS,
  filter: EventFilterValues,
) {
  return rows.filter((row) => {
    if (filter.deviceId === 'all') return true
    return row.deviceId === filter.deviceId
  })
}

export function OperationLogPage() {
  const [draft, setDraft] = useState<EventFilterValues>(DEFAULT_EVENT_FILTER)
  const [applied, setApplied] = useState<EventFilterValues>(DEFAULT_EVENT_FILTER)
  const [page, setPage] = useState(1)

  const filteredRows = useMemo(
    () => filterOperationLogs(OPERATION_LOG_ROWS, applied),
    [applied],
  )

  const totalRecords = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / OPERATION_LOG_PAGE_SIZE) || 1)
  const currentPage = Math.min(page, totalPages)
  const pageRows = filteredRows
    .slice(
      (currentPage - 1) * OPERATION_LOG_PAGE_SIZE,
      currentPage * OPERATION_LOG_PAGE_SIZE,
    )
    .map((row, index) => ({
      ...row,
      stt: (currentPage - 1) * OPERATION_LOG_PAGE_SIZE + index + 1,
    }))

  return (
    <div className={styles.page}>
      <EventFilterBar
        values={draft}
        deviceOptions={EVENT_DEVICE_OPTIONS}
        onChange={setDraft}
        showKeyword={false}
        resetLabel="Xóa lọc"
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
          console.log('Xuất Excel nhật ký vận hành', applied)
        }}
      />

      <div className={`${styles.tablePanel} ${styles.operationLogTable}`}>
        <DataTable
          columns={OPERATION_LOG_COLUMNS}
          data={pageRows}
          rowKey={(row) => row.id}
          minRows={8}
          totalCount={totalRecords}
          emptyText="Không có dữ liệu"
          footer={
            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
          }
        />
      </div>
    </div>
  )
}
