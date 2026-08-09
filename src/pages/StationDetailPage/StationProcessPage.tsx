import { useState } from 'react'
import { StationAlertBar } from '@/components/common/StationAlertBar'
import { ProcessDiagram } from './ProcessDiagram'
import { PROCESS_PUMPS, type ProcessPumpCard } from './processMock'
import styles from './StationPage.module.css'

export function StationProcessPage() {
  // Sau này thay bằng dữ liệu realtime (SignalR / polling API)
  const [pumps] = useState<ProcessPumpCard[]>(PROCESS_PUMPS)

  return (
    <div className={`${styles.page} ${styles.processPage}`}>
      <section className={styles.panel}>
        <div className={styles.diagramStage}>
          <div className={`${styles.diagramInner} ${styles.processInner}`}>
            <ProcessDiagram pumps={pumps} />
          </div>
        </div>
      </section>

      <StationAlertBar
        count={2}
        alerts={[
          {
            time: '10:28:32',
            device: 'Bơm 2',
            message: 'Quá dòng',
          },
        ]}
      />
    </div>
  )
}
