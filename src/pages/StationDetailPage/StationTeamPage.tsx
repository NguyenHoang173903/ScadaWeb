import styles from './TeamPage.module.css'

export function StationTeamPage() {
  return (
    <div className={styles.page}>
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Chưa có dữ liệu tổ vận hành</p>
        <p className={styles.emptyHint}>
          Backend chưa cung cấp API nhân sự / ca kíp theo trạm. Trang sẽ hiển thị khi BE bổ sung
          endpoint (ví dụ <code>GET /stations/{'{id}'}/team</code>).
        </p>
      </div>
    </div>
  )
}
