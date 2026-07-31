import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import styles from './Pagination.module.css'

type PaginationProps = {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const safeTotal = Math.max(1, totalPages)
  const safePage = Math.min(Math.max(1, page), safeTotal)

  return (
    <div className={styles.pagination}>
      <button
        type="button"
        className={styles.navButton}
        disabled={safePage <= 1}
        aria-label="Trang đầu"
        onClick={() => onChange(1)}
      >
        <ChevronsLeft size={16} />
      </button>
      <button
        type="button"
        className={styles.navButton}
        disabled={safePage <= 1}
        aria-label="Trang trước"
        onClick={() => onChange(safePage - 1)}
      >
        <ChevronLeft size={16} />
      </button>

      <span className={styles.pageBadge}>
        Trang {safePage}/{safeTotal}
      </span>

      <button
        type="button"
        className={styles.navButton}
        disabled={safePage >= safeTotal}
        aria-label="Trang sau"
        onClick={() => onChange(safePage + 1)}
      >
        <ChevronRight size={16} />
      </button>
      <button
        type="button"
        className={styles.navButton}
        disabled={safePage >= safeTotal}
        aria-label="Trang cuối"
        onClick={() => onChange(safeTotal)}
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  )
}
