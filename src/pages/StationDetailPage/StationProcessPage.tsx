import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { StationAlertBar } from '@/components/common/StationAlertBar'
import { isApiError } from '@/services/api/http'
import { useScadaRealtime } from '@/services/realtime'
import { mapProcessPumps } from '@/services/stations/mappers'
import {
  getDeviceMonitor,
  getStationSchematic,
  peekDeviceMonitor,
  peekStationSchematic,
} from '@/services/stations/stationsApi'
import { ProcessDiagram } from './ProcessDiagram'
import { PROCESS_PUMPS, type ProcessPumpCard } from './processMock'
import styles from './StationPage.module.css'

export function StationProcessPage() {
  const { stationId = '' } = useParams()
  const numericStation = /^\d+$/.test(stationId)
  const stationNumber = numericStation ? Number(stationId) : null
  const cachedSchematic = stationNumber == null ? undefined : peekStationSchematic(stationNumber)
  const cachedMonitor = stationNumber == null ? undefined : peekDeviceMonitor(stationNumber)
  const [pumps, setPumps] = useState<ProcessPumpCard[]>(() =>
    cachedSchematic
      ? mapProcessPumps(cachedSchematic.pumps ?? [], PROCESS_PUMPS)
      : [],
  )
  const [riverLevel, setRiverLevel] = useState<number | null>(() => {
    const value = cachedMonitor?.items.find(
      (item) => typeof item.waterLevel?.river === 'number',
    )?.waterLevel.river
    return typeof value === 'number' && Number.isFinite(value) ? value : null
  })
  const [ready, setReady] = useState(Boolean(cachedSchematic && cachedMonitor))
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (stationNumber == null) return
    try {
      const [schematic, monitor] = await Promise.all([
        getStationSchematic(stationNumber),
        getDeviceMonitor(stationNumber),
      ])
      const nextRiverLevel = monitor.items.find(
        (item) => typeof item.waterLevel?.river === 'number',
      )?.waterLevel.river
      setPumps(mapProcessPumps(schematic.pumps ?? [], PROCESS_PUMPS))
      setRiverLevel(
        typeof nextRiverLevel === 'number' && Number.isFinite(nextRiverLevel)
          ? nextRiverLevel
          : null,
      )
      setReady(true)
      setError('')
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Không tải được sơ đồ công nghệ.')
    }
  }, [stationNumber])

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
        {ready ? (
          <div className={styles.diagramStage}>
            <div className={`${styles.diagramInner} ${styles.processInner}`}>
              <ProcessDiagram pumps={pumps} riverLevel={riverLevel} />
            </div>
          </div>
        ) : (
          <div className={styles.diagramLoading}>Đang tải dữ liệu vận hành...</div>
        )}
      </section>

      <StationAlertBar count={0} alerts={[]} />
    </div>
  )
}
