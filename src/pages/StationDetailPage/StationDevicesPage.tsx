import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { StationAlertBar } from '@/components/common/StationAlertBar'
import { isApiError } from '@/services/api/http'
import { useScadaRealtime } from '@/services/realtime'
import { mapDeviceMonitorItem } from '@/services/stations/mappers'
import {
  getDeviceMonitor,
  peekDeviceMonitor,
} from '@/services/stations/stationsApi'
import { DeviceCard } from './DeviceCard'
import { getDevicesByGroup, type DevicePump } from './devicesMock'
import styles from './DevicesPage.module.css'

type DeviceGroup = '1-5' | '6-10'

function isDeviceGroup(value: string | undefined): value is DeviceGroup {
  return value === '1-5' || value === '6-10'
}

function filterGroup(pumps: DevicePump[], group: DeviceGroup) {
  const sorted = [...pumps].sort((a, b) => a.pumpIndex - b.pumpIndex || a.id - b.id)
  if (group === '1-5') return sorted.filter((p) => p.pumpIndex >= 1 && p.pumpIndex <= 5)
  return sorted.filter((p) => p.pumpIndex >= 6 && p.pumpIndex <= 10)
}

export function StationDevicesPage() {
  const { stationId = '', group } = useParams()
  const validGroup = isDeviceGroup(group) ? group : null
  const numericStation = /^\d+$/.test(stationId)
  const stationNumber = numericStation ? Number(stationId) : null
  const cachedMonitor = stationNumber == null ? undefined : peekDeviceMonitor(stationNumber)
  const [pumps, setPumps] = useState<DevicePump[]>(() =>
    (cachedMonitor?.items ?? []).map(mapDeviceMonitorItem),
  )
  const [ready, setReady] = useState(Boolean(cachedMonitor))
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (stationNumber == null) return
    try {
      const result = await getDeviceMonitor(stationNumber)
      setPumps((result.items ?? []).map(mapDeviceMonitorItem))
      setReady(true)
      setError('')
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Không tải được danh sách bơm.')
    }
  }, [stationNumber])

  useEffect(() => {
    void load()
  }, [load])

  useScadaRealtime({
    stationId,
    screen: 'chi-tiet-bom',
    enabled: numericStation,
    onInvalidate: () => {
      void load()
    },
  })

  const visible = useMemo(() => {
    if (!validGroup) return []
    if (numericStation) return filterGroup(pumps, validGroup)
    return getDevicesByGroup(validGroup)
  }, [numericStation, pumps, validGroup])

  if (!group) {
    return <Navigate to={`/stations/${stationId}/devices/1-5`} replace />
  }

  if (!validGroup) {
    return <Navigate to={`/stations/${stationId}/devices/1-5`} replace />
  }

  return (
    <div className={styles.page}>
      {error ? <p style={{ color: '#b91c1c', margin: '0 0 12px' }}>{error}</p> : null}
      {ready ? (
        <div className={styles.grid}>
          {visible.map((pump) => (
            <DeviceCard key={pump.id} pump={pump} />
          ))}
        </div>
      ) : (
        <div className={styles.devicesLoading}>Đang tải dữ liệu vận hành...</div>
      )}

      <StationAlertBar count={0} alerts={[]} />
    </div>
  )
}
