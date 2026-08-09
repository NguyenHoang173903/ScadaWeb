import { StationAlertBar } from '@/components/common/StationAlertBar'
import { SchematicDiagram } from './SchematicDiagram'
import styles from './StationPage.module.css'

export function StationSchematicPage() {
  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <SchematicDiagram />
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
