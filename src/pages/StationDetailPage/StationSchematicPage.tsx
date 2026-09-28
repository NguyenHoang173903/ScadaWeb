import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { StationAlertBar } from '@/components/common/StationAlertBar'
import { isApiError } from '@/services/api/http'
import { useScadaRealtime } from '@/services/realtime'
import { mapElectricalParams, mapSchematicPumps } from '@/services/stations/mappers'
import {
  stationElectricalQuery,
  stationQueryKeys,
  stationSchematicQuery,
} from '@/services/stations/stationQueries'
import { SchematicDiagram } from './SchematicDiagram'
import {
  ELECTRICAL_PARAMS,
  PUMP_BRANCHES,
  type ElectricalParams,
  type PumpBranch,
} from './schematicMock'
import styles from './StationPage.module.css'

export function StationSchematicPage() {
  const { stationId = '' } = useParams()
  const numericStation = /^\d+$/.test(stationId)
  const stationNumber = numericStation ? Number(stationId) : null
  const queryClient = useQueryClient()
  const schematic = useQuery({
    ...stationSchematicQuery(stationNumber ?? 0),
    enabled: stationNumber != null,
  })
  const electricalQuery = useQuery({
    ...stationElectricalQuery(stationNumber ?? 0),
    enabled: stationNumber != null,
  })
  const pumps = useMemo<PumpBranch[]>(
    () =>
      schematic.data
        ? mapSchematicPumps(schematic.data.pumps ?? [], PUMP_BRANCHES)
        : [],
    [schematic.data],
  )
  const electrical = useMemo<ElectricalParams>(
    () =>
      electricalQuery.data
        ? mapElectricalParams(electricalQuery.data, ELECTRICAL_PARAMS)
        : ELECTRICAL_PARAMS,
    [electricalQuery.data],
  )
  const ready = Boolean(schematic.data && electricalQuery.data)
  const queryError = schematic.error ?? electricalQuery.error
  const error = queryError
    ? isApiError(queryError)
      ? queryError.message
      : 'Không tải được sơ đồ nguyên lý.'
    : ''

  useScadaRealtime({
    stationId,
    screen: 'nguyen-ly',
    enabled: numericStation,
    onInvalidate: () => {
      if (stationNumber == null) return
      void queryClient.invalidateQueries({
        queryKey: stationQueryKeys.schematic(stationNumber),
      })
      void queryClient.invalidateQueries({
        queryKey: stationQueryKeys.electrical(stationNumber),
      })
    },
  })

  return (
    <div className={styles.page}>
      {error ? <p style={{ color: '#b91c1c', margin: '0 0 12px' }}>{error}</p> : null}
      <section className={styles.panel}>
        {ready ? (
          <SchematicDiagram pumps={pumps} electrical={electrical} />
        ) : (
          <div className={styles.diagramLoading}>Đang tải dữ liệu vận hành...</div>
        )}
      </section>

      <StationAlertBar count={0} alerts={[]} />
    </div>
  )
}
