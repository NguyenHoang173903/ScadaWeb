import { useOutletContext } from 'react-router-dom'
import { StationAlertBar } from '@/components/common/StationAlertBar'
import type { PumpStation } from '@/data/pumpStations'
import styles from './StationPage.module.css'

type StationOutletContext = {
  station: PumpStation
}

type StationSectionPageProps = {
  title: string
  description: string
  showAlert?: boolean
}

export function StationSectionPage({
  title,
  description,
  showAlert = false,
}: StationSectionPageProps) {
  const { station } = useOutletContext<StationOutletContext>()

  return (
    <div className={styles.page}>
      {showAlert ? (
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
      ) : null}

      <section className={styles.panel}>
        <h2>{title}</h2>
        <p>{description}</p>
        <p className={styles.hint}>
          Nội dung chi tiết cho <strong>{station.name}</strong> sẽ được bổ sung sau.
        </p>
      </section>
    </div>
  )
}
