import { Button } from '@/components/common/Button'
import styles from './SessionExpiredDialog.module.css'

type Props = {
  onLogin: () => void
}

export function SessionExpiredDialog({ onLogin }: Props) {
  return (
    <div className={styles.backdrop} role="alertdialog" aria-modal="true" aria-labelledby="session-expired-title">
      <div className={styles.dialog}>
        <h2 id="session-expired-title">Phiên làm việc đã hết hạn</h2>
        <p>
          Hệ thống không nhận được thao tác từ người dùng trong thời gian chờ đã cấu hình. Phiên kết
          nối đã được đóng. Vui lòng đăng nhập lại để tiếp tục.
        </p>
        <Button type="button" variant="primary" onClick={onLogin}>
          Đăng nhập lại
        </Button>
      </div>
    </div>
  )
}
