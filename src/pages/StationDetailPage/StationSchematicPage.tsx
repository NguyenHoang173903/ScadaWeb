import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { StationAlertBar } from '@/components/common/StationAlertBar'
import { isApiError } from '@/services/api/http'
import { useScadaRealtime } from '@/services/realtime'
import { mapElectricalParams, mapSchematicPumps } from '@/services/stations/mappers'
import { getStationElectrical, getStationSchematic } from '@/services/stations/stationsApi'
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
  const [pumps, setPumps] = useState<PumpBranch[]>(PUMP_BRANCHES)
  const [electrical, setElectrical] = useState<ElectricalParams>(ELECTRICAL_PARAMS)
  const [error, setError] = useState('')
  const [live, setLive] = useState(false)

  const load = useCallback(async () => {
    if (!numericStation) return
    try {
      const [schematic, electricalDto] = await Promise.all([
        getStationSchematic(Number(stationId)),
        getStationElectrical(Number(stationId)),
      ])
      setPumps(mapSchematicPumps(schematic.pumps ?? [], PUMP_BRANCHES))
      setElectrical(mapElectricalParams(electricalDto, ELECTRICAL_PARAMS))
      setError('')
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Không tải được sơ đồ nguyên lý.')
    }
  }, [stationId, numericStation])

  useEffect(() => {
    void load()
  }, [load])

  useScadaRealtime({
    stationId,
    screen: 'nguyen-ly',
    enabled: numericStation,
    onInvalidate: () => {
      setLive(true)
      void load()
    },
  })

  return (
    <div className={styles.page}>
      {error ? <p style={{ color: '#b91c1c', margin: '0 0 12px' }}>{error}</p> : null}
      {live ? (
        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#166534' }}>Realtime SignalR đang cập nhật</p>
      ) : null}
      <section className={styles.panel}>
        <SchematicDiagram pumps={pumps} electrical={electrical} />
      </section>

      <StationAlertBar count={0} alerts={[]} />
    </div>
  )
}
