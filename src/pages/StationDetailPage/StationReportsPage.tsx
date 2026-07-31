import { useMemo, useState } from 'react'
import { DataTable } from '@/components/common/DataTable'
import { Pagination } from '@/components/common/Pagination'
import {
  ReportFilterBar,
  type ReportFilterValues,
} from '@/components/common/ReportFilterBar'
import {
  DEFAULT_REPORT_FILTER,
  getReportColumns,
  getReportRows,
  REPORT_DEVICE_OPTIONS,
  REPORT_PAGE_SIZE,
} from './reportsMock'
import styles from './ReportsPage.module.css'

export function StationReportsPage() {
  const [draft, setDraft] = useState<ReportFilterValues>(DEFAULT_REPORT_FILTER)
  const [applied, setApplied] = useState<ReportFilterValues>(DEFAULT_REPORT_FILTER)
  const [page, setPage] = useState(1)

  const rows = useMemo(() => getReportRows(draft.deviceId), [draft.deviceId])
  const totalRecords = rows.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / REPORT_PAGE_SIZE) || 1)
  const currentPage = Math.min(page, totalPages)
  const pageRows = rows.slice(
    (currentPage - 1) * REPORT_PAGE_SIZE,
    currentPage * REPORT_PAGE_SIZE,
  )

  const columns = getReportColumns(draft.deviceId)

  return (
    <div className={styles.page}>
      <ReportFilterBar
        values={draft}
        deviceOptions={REPORT_DEVICE_OPTIONS}
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

      <div className={styles.tablePanel}>
        <DataTable
          key={draft.deviceId}
          columns={columns}
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
