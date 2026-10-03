import { useQuery } from '@tanstack/react-query'
import { isApiError } from '@/services/api/http'
import { stationActiveAlarmCarouselQuery } from '@/services/stations/stationQueries'
import { StationAlertBar, type StationAlert } from './StationAlertBar'

type StationActiveAlertBarProps = {
  stationId: number | null
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function StationActiveAlertBar({ stationId }: StationActiveAlertBarProps) {
  const alarms = useQuery({
    ...stationActiveAlarmCarouselQuery(stationId ?? 0),
    enabled: stationId != null,
  })

  if (alarms.error) {
    const message = isApiError(alarms.error)
      ? alarms.error.message
      : 'Không tải được lỗi đang tồn tại.'
    return <p role="alert" style={{ color: '#b91c1c', margin: 0 }}>{message}</p>
  }

  const alerts: StationAlert[] = (alarms.data?.items ?? []).map((item) => ({
    time: formatTime(item.startTime),
    device: item.deviceName || '—',
    message: item.description || item.title,
  }))

  return (
    <StationAlertBar
      count={alarms.data?.totalCount ?? alarms.data?.items.length ?? 0}
      alerts={alerts}
    />
  )
}
