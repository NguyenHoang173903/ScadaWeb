import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { StationAlertBar } from '@/components/common/StationAlertBar'
import { isApiError } from '@/services/api/http'
import { useScadaRealtime } from '@/services/realtime'
import { mapElectricalParams, mapSchematicPumps } from '@/services/stations/mappers'
import {
  getStationElectrical,
  getStationSchematic,
  peekStationElectrical,
  peekStationSchematic,
} from '@/services/stations/stationsApi'
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
  const cachedSchematic = stationNumber == null ? undefined : peekStationSchematic(stationNumber)
  const cachedElectrical = stationNumber == null ? undefined : peekStationElectrical(stationNumber)
  const [pumps, setPumps] = useState<PumpBranch[]>(() =>
    cachedSchematic
      ? mapSchematicPumps(cachedSchematic.pumps ?? [], PUMP_BRANCHES)
      : [],
  )
  const [electrical, setElectrical] = useState<ElectricalParams>(() =>
    cachedElectrical
      ? mapElectricalParams(cachedElectrical, ELECTRICAL_PARAMS)
      : ELECTRICAL_PARAMS,
  )
  const [ready, setReady] = useState(Boolean(cachedSchematic && cachedElectrical))
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (stationNumber == null) return
    try {
      const [schematic, electricalDto] = await Promise.all([
        getStationSchematic(stationNumber),
        getStationElectrical(stationNumber),
      ])
      setPumps(mapSchematicPumps(schematic.pumps ?? [], PUMP_BRANCHES))
      setElectrical(mapElectricalParams(electricalDto, ELECTRICAL_PARAMS))
      setReady(true)
      setError('')
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Không tải được sơ đồ nguyên lý.')
    }
  }, [stationNumber])

  useEffect(() => {
    void load()
  }, [load])

  useScadaRealtime({
    stationId,
    screen: 'nguyen-ly',
    enabled: numericStation,
    onInvalidate: () => {
      void load()
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
