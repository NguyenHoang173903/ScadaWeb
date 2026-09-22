import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { StationAlertBar } from '@/components/common/StationAlertBar'
import { isApiError } from '@/services/api/http'
import { useScadaRealtime } from '@/services/realtime'
import { mapProcessPumps } from '@/services/stations/mappers'
import { getStationSchematic } from '@/services/stations/stationsApi'
import { ProcessDiagram } from './ProcessDiagram'
import { PROCESS_PUMPS, type ProcessPumpCard } from './processMock'
import styles from './StationPage.module.css'

export function StationProcessPage() {
  const { stationId = '' } = useParams()
  const numericStation = /^\d+$/.test(stationId)
  const [pumps, setPumps] = useState<ProcessPumpCard[]>(PROCESS_PUMPS)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!numericStation) return
    try {
      const schematic = await getStationSchematic(Number(stationId))
      setPumps(mapProcessPumps(schematic.pumps ?? [], PROCESS_PUMPS))
      setError('')
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Không tải được sơ đồ công nghệ.')
    }
  }, [stationId, numericStation])

  useEffect(() => {
    void load()
  }, [load])

  useScadaRealtime({
    stationId,
    screen: 'cong-nghe',
    enabled: numericStation,
    onInvalidate: () => {
      void load()
    },
  })

  return (
    <div className={`${styles.page} ${styles.processPage}`}>
      {error ? <p style={{ color: '#b91c1c', margin: '0 0 12px' }}>{error}</p> : null}
      <section className={styles.panel}>
        <div className={styles.diagramStage}>
          <div className={`${styles.diagramInner} ${styles.processInner}`}>
            <ProcessDiagram pumps={pumps} />
          </div>
        </div>
      </section>

      <StationAlertBar count={0} alerts={[]} />
    </div>
  )
}
