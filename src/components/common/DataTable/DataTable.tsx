import type { ReactNode } from 'react'
import styles from './DataTable.module.css'

export type DataTableColumn<T> = {
  key: string
  header: string
  width?: string | number
  align?: 'left' | 'center' | 'right'
  render: (row: T, index: number) => ReactNode
}

type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  data: T[]
  rowKey: (row: T, index: number) => string
  minRows?: number
  emptyText?: string
  selectedKey?: string | null
  onRowClick?: (row: T) => void
  /** Tổng số bản ghi thật (khi phân trang). Mặc định = data.length. Không tính hàng placeholder. */
  totalCount?: number
  totalUnit?: string
  showTotal?: boolean
  footer?: ReactNode
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  minRows = 0,
  emptyText = 'Không có dữ liệu',
  selectedKey,
  onRowClick,
  totalCount,
  totalUnit = 'bản ghi',
  showTotal = true,
  footer,
}: DataTableProps<T>) {
  const placeholderCount = Math.max(0, minRows - data.length)
  const resolvedTotal = totalCount ?? data.length
  const columnsMinWidth = columns.reduce((sum, column) => {
    const width = column.width
    if (typeof width === 'number') return sum + width
    if (typeof width === 'string') {
      const parsed = Number.parseFloat(width)
      return Number.isFinite(parsed) ? sum + parsed : sum
    }
    return sum + 120
  }, 0)

  const tableMinWidth = Math.max(columnsMinWidth, 640)

  return (
    <div
      className={styles.root}
      style={{ ['--table-min-width' as string]: `${tableMinWidth}px` }}
    >
      <div className={styles.wrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    width: column.width,
                    textAlign: column.align ?? 'left',
                  }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && placeholderCount === 0 ? (
              <tr>
                <td className={styles.empty} colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            ) : null}

            {data.map((row, index) => {
              const key = rowKey(row, index)
              const selected = selectedKey === key

              return (
                <tr
                  key={key}
                  className={selected ? styles.selected : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      style={{ textAlign: column.align ?? 'left' }}
                    >
                      {column.render(row, index)}
                    </td>
                  ))}
                </tr>
              )
            })}

            {Array.from({ length: placeholderCount }).map((_, index) => (
              <tr key={`empty-${index}`} className={styles.placeholder}>
                {columns.map((column) => (
                  <td key={column.key}>&nbsp;</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showTotal || footer ? (
        <div className={styles.footer}>
          {showTotal ? (
            <p className={styles.total}>
              Tổng: {resolvedTotal} {totalUnit}
            </p>
          ) : (
            <span />
          )}
          {footer ? <div className={styles.footerExtra}>{footer}</div> : null}
        </div>
      ) : null}
    </div>
  )
}
