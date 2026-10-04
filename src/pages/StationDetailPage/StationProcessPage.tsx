import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { StationActiveAlertBar } from '@/components/common/StationAlertBar'
import { isApiError } from '@/services/api/http'
import { useScadaRealtime } from '@/services/realtime'
import { mapProcessPumps } from '@/services/stations/mappers'
import {
  stationMonitorQuery,
  stationQueryKeys,
  stationSchematicQuery,
} from '@/services/stations/stationQueries'
import { DiagramFit } from './DiagramFit'
import { ProcessDiagram } from './ProcessDiagram'
import { PROCESS_PUMPS, type ProcessPumpCard } from './processMock'
import styles from './StationPage.module.css'

export function StationProcessPage() {
  const { stationId = '' } = useParams()
  const numericStation = /^\d+$/.test(stationId)
  const stationNumber = numericStation ? Number(stationId) : null
  const queryClient = useQueryClient()
  const schematic = useQuery({
    ...stationSchematicQuery(stationNumber ?? 0),
    enabled: stationNumber != null,
  })
  const monitor = useQuery({
    ...stationMonitorQuery(stationNumber ?? 0),
    enabled: stationNumber != null,
  })
  const pumps = useMemo<ProcessPumpCard[]>(
    () =>
      schematic.data
        ? mapProcessPumps(schematic.data.pumps ?? [], PROCESS_PUMPS)
        : [],
    [schematic.data],
  )
  const riverLevel = useMemo<number | null>(() => {
    const value = monitor.data?.items.find(
      (item) => typeof item.waterLevel?.river === 'number',
    )?.waterLevel.river
    return typeof value === 'number' && Number.isFinite(value) ? value : null
  }, [monitor.data])
  const basinLevel = useMemo<number | null>(() => {
    const value = monitor.data?.items.find(
      (item) => typeof item.waterLevel?.basin === 'number',
    )?.waterLevel.basin
    return typeof value === 'number' && Number.isFinite(value) ? value : null
  }, [monitor.data])
  const ready = Boolean(schematic.data && monitor.data)
  const queryError = schematic.error ?? monitor.error
  const error = queryError
    ? isApiError(queryError)
      ? queryError.message
      : 'Không tải được sơ đồ công nghệ.'
    : ''

  useScadaRealtime({
    stationId,
    screen: 'cong-nghe',
    enabled: numericStation,
    onInvalidate: () => {
      if (stationNumber == null) return
      void queryClient.invalidateQueries({
        queryKey: stationQueryKeys.schematic(stationNumber),
      })
      void queryClient.invalidateQueries({
        queryKey: stationQueryKeys.monitor(stationNumber),
      })
      void queryClient.invalidateQueries({
        queryKey: stationQueryKeys.activeAlarms(stationNumber),
      })
    },
  })

  return (
    <div className={`${styles.page} ${styles.processPage}`}>
      {error ? <p style={{ color: '#b91c1c', margin: '0 0 12px' }}>{error}</p> : null}
      <section className={styles.panel}>
        {ready ? (
          <div className={styles.diagramStage}>
            <DiagramFit designWidth={1100}>
              <div className={`${styles.diagramInner} ${styles.processInner}`}>
                <ProcessDiagram
                  pumps={pumps}
                  riverLevel={riverLevel}
                  basinLevel={basinLevel}
                />
              </div>
            </DiagramFit>
          </div>
        ) : (
          <div className={styles.diagramLoading}>Đang tải dữ liệu vận hành...</div>
        )}
      </section>

      <StationActiveAlertBar stationId={stationNumber} />
    </div>
  )
}
