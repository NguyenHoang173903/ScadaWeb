import { Navigate, useParams } from 'react-router-dom'
import { StationAlertBar } from '@/components/common/StationAlertBar'
import { DeviceCard } from './DeviceCard'
import { getDevicesByGroup } from './devicesMock'
import styles from './DevicesPage.module.css'

type DeviceGroup = '1-5' | '6-10'

function isDeviceGroup(value: string | undefined): value is DeviceGroup {
  return value === '1-5' || value === '6-10'
}

export function StationDevicesPage() {
  const { stationId = '', group } = useParams()

  if (!group) {
    return <Navigate to={`/stations/${stationId}/devices/1-5`} replace />
  }

  if (!isDeviceGroup(group)) {
    return <Navigate to={`/stations/${stationId}/devices/1-5`} replace />
  }

  const pumps = getDevicesByGroup(group)

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        {pumps.map((pump) => (
          <DeviceCard key={pump.id} pump={pump} />
        ))}
      </div>

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
