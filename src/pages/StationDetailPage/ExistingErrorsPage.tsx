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
  EVENT_PAGE_SIZE,
  EXISTING_ERROR_COLUMNS,
  EXISTING_ERROR_ROWS,
} from './eventsMock'
import styles from './EventsPage.module.css'

function filterExistingErrors(rows: typeof EXISTING_ERROR_ROWS, filter: EventFilterValues) {
  const keyword = filter.keyword.trim().toLowerCase()

  return rows.filter((row) => {
    if (filter.deviceId !== 'all' && row.device !== EVENT_DEVICE_OPTIONS.find((o) => o.value === filter.deviceId)?.label) {
      return false
    }
    if (!keyword) return true
    return [row.device, row.description, row.type, row.startedAt, row.endedAt]
      .join(' ')
      .toLowerCase()
      .includes(keyword)
  })
}

export function ExistingErrorsPage() {
  const [draft, setDraft] = useState<EventFilterValues>(DEFAULT_EVENT_FILTER)
  const [applied, setApplied] = useState<EventFilterValues>(DEFAULT_EVENT_FILTER)
  const [page, setPage] = useState(1)

  const filteredRows = useMemo(
    () => filterExistingErrors(EXISTING_ERROR_ROWS, applied),
    [applied],
  )

  const totalRecords = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / EVENT_PAGE_SIZE) || 1)
  const currentPage = Math.min(page, totalPages)
  const pageRows = filteredRows.slice(
    (currentPage - 1) * EVENT_PAGE_SIZE,
    currentPage * EVENT_PAGE_SIZE,
  )

  return (
    <div className={styles.page}>
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
          console.log('Xuất Excel lỗi tồn tại', applied)
        }}
      />

      <div className={styles.tablePanel}>
        <DataTable
          columns={EXISTING_ERROR_COLUMNS}
          data={pageRows}
          rowKey={(row) => row.id}
          minRows={8}
          totalCount={totalRecords}
          emptyText="Không có dữ liệu"
          updateHint="Dữ liệu cập nhật 30 phút 1 lần"
          footer={
            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
          }
        />
      </div>
    </div>
  )
}
