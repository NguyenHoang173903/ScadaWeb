import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useParams } from 'react-router-dom'
import { StationAlertBar } from '@/components/common/StationAlertBar'
import { isApiError } from '@/services/api/http'
import { useScadaRealtime } from '@/services/realtime'
import { mapDeviceMonitorItem } from '@/services/stations/mappers'
import {
  stationMonitorQuery,
  stationQueryKeys,
} from '@/services/stations/stationQueries'
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
  const queryClient = useQueryClient()
  const monitor = useQuery({
    ...stationMonitorQuery(stationNumber ?? 0),
    enabled: stationNumber != null,
  })
  const pumps = useMemo<DevicePump[]>(
    () => (monitor.data?.items ?? []).map(mapDeviceMonitorItem),
    [monitor.data],
  )
  const ready = Boolean(monitor.data)
  const error = monitor.error
    ? isApiError(monitor.error)
      ? monitor.error.message
      : 'Không tải được danh sách bơm.'
    : ''

  useScadaRealtime({
    stationId,
    screen: 'chi-tiet-bom',
    enabled: numericStation,
    onInvalidate: () => {
      if (stationNumber == null) return
      void queryClient.invalidateQueries({
        queryKey: stationQueryKeys.monitor(stationNumber),
      })
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
