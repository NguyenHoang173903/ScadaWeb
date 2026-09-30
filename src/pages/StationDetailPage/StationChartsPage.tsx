import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useParams } from 'react-router-dom'
import {
  ChartFilterBar,
  type ChartFilterValues,
} from '@/components/common/ChartFilterBar'
import { LineChartCard, type LineChartPoint } from '@/components/common/LineChartCard'
import { isApiError } from '@/services/api/http'
import { useScadaRealtime } from '@/services/realtime'
import {
  getLatestCachedChart,
  stationChartDevicesQuery,
  stationChartHistoryQuery,
  stationReportDevicesQuery,
} from '@/services/stations/stationQueries'
import {
  CHART_DEVICE_OPTIONS,
  createDefaultChartFilter,
  CURRENT_CHART_DATA,
  CURRENT_SERIES,
  TEMPERATURE_CHART_DATA,
  TEMPERATURE_SERIES,
  WATER_LEVEL_SERIES,
  type ChartTabId,
} from './chartsMock'
import styles from './ChartsPage.module.css'

function isChartTab(value: string | undefined): value is ChartTabId {
  return value === 'temperature' || value === 'current' || value === 'water'
}

function toIsoRange(filter: ChartFilterValues, liveTo?: Date) {
  const from = new Date(`${filter.fromDate}T${filter.fromTime || '00:00:00'}`)
  const to = liveTo ?? new Date(`${filter.toDate}T${filter.toTime || '23:59:59'}`)
  // If identical timestamps (mock default), expand a 1h window so BE returns points.
  if (to.getTime() <= from.getTime()) {
    to.setTime(from.getTime() + 60 * 60 * 1000)
  }
  return { from: from.toISOString(), to: to.toISOString() }
}

function formatAxisTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function getWaterLevelDomain(data: LineChartPoint[]): [number, number] {
  const values = data.flatMap((point) =>
    WATER_LEVEL_SERIES.map((item) => point[item.key]).filter(
      (value): value is number => typeof value === 'number' && Number.isFinite(value),
    ),
  )
  if (!values.length) return [0, 1]

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(max - min, Math.abs(max) * 0.1, 0.1)
  const lower = min >= 0 ? 0 : min - range * 0.1
  const upper = max + range * 0.1
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(Math.abs(lower), Math.abs(upper), 0.1)))
  const step = magnitude / 10

  return [
    lower === 0 ? 0 : Math.floor(lower / step) * step,
    Math.ceil(upper / step) * step,
  ]
}

export function StationChartsPage() {
  const { stationId = '', chartType } = useParams()
  const numericStation = /^\d+$/.test(stationId)
  const stationNumber = numericStation ? Number(stationId) : null
  const validChartType = isChartTab(chartType) ? chartType : null
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<ChartFilterValues>(createDefaultChartFilter)
  const [applied, setApplied] = useState<ChartFilterValues>(createDefaultChartFilter)
  const [deviceOptions, setDeviceOptions] = useState(CHART_DEVICE_OPTIONS)
  const [liveTo, setLiveTo] = useState(() => new Date())
  const chartDevices = useQuery({
    ...stationChartDevicesQuery(stationNumber ?? 0),
    enabled: stationNumber != null && validChartType !== 'water',
  })
  const waterDevices = useQuery({
    ...stationReportDevicesQuery(stationNumber ?? 0),
    enabled: stationNumber != null && validChartType === 'water',
  })

  useEffect(() => {
    const source = validChartType === 'water' ? waterDevices.data : chartDevices.data
    const waterCandidates = source?.filter((device) =>
      /level|mức|muc|nước|nuoc|sensor/i.test(device.name),
    )
    const devices = validChartType === 'water'
      ? waterCandidates?.length
        ? waterCandidates
        : source?.slice(0, 1)
      : source
    if (!devices?.length) return
    const options = devices.map((d) => ({ value: String(d.id), label: d.name }))
    setDeviceOptions(options)
    setDraft((prev) => ({ ...prev, deviceId: options[0].value }))
    setApplied((prev) => ({ ...prev, deviceId: options[0].value }))
  }, [chartDevices.data, validChartType, waterDevices.data])

  const deviceId = Number(applied.deviceId)
  const range = useMemo(
    () => toIsoRange(applied, validChartType === 'water' ? liveTo : undefined),
    [applied, liveTo, validChartType],
  )
  const cachedChart =
    stationNumber != null && Number.isFinite(deviceId) && validChartType
      ? getLatestCachedChart(queryClient, stationNumber, deviceId, validChartType)
      : undefined
  const chartHistory = useQuery({
    ...stationChartHistoryQuery(
      stationNumber ?? 0,
      Number.isFinite(deviceId) ? deviceId : 0,
      validChartType ?? 'temperature',
      range,
      cachedChart,
    ),
    enabled:
      stationNumber != null &&
      Number.isFinite(deviceId) &&
      deviceId > 0 &&
      validChartType != null,
  })

  useScadaRealtime({
    stationId: stationNumber ?? undefined,
    screen: 'trend',
    deviceId: Number.isFinite(deviceId) ? deviceId : undefined,
    enabled: validChartType === 'water' && deviceId > 0,
    throttleMs: 5_000,
    pollIntervalMs: 10_000,
    onInvalidate: () => setLiveTo(new Date()),
  })

  const chartData = useMemo<LineChartPoint[]>(() => {
    if (!numericStation) {
      if (validChartType === 'temperature') return TEMPERATURE_CHART_DATA
      if (validChartType === 'current') return CURRENT_CHART_DATA
      return []
    }
    const byTime = new Map<number, LineChartPoint>()
    for (const series of chartHistory.data?.series ?? []) {
      for (const point of series.points ?? []) {
        const timestamp = new Date(point.timestamp).getTime()
        if (!Number.isFinite(timestamp)) continue
        const row = byTime.get(timestamp) ?? {
          time: formatAxisTime(point.timestamp),
        }
        row[series.key] = point.value
        byTime.set(timestamp, row)
      }
    }
    return [...byTime.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, row]) => row)
  }, [chartHistory.data, numericStation, validChartType])
  const queryError = chartHistory.error ?? chartDevices.error ?? waterDevices.error
  const error = queryError
    ? isApiError(queryError)
      ? queryError.message
      : 'Không tải được đồ thị.'
    : ''

  const series = useMemo(
    () =>
      chartType === 'current'
        ? CURRENT_SERIES
        : chartType === 'water'
          ? WATER_LEVEL_SERIES
          : TEMPERATURE_SERIES,
    [chartType],
  )
  const waterLevelDomain = useMemo(() => getWaterLevelDomain(chartData), [chartData])

  if (!chartType) {
    return <Navigate to={`/stations/${stationId}/charts/temperature`} replace />
  }

  if (!isChartTab(chartType)) {
    return <Navigate to={`/stations/${stationId}/charts/temperature`} replace />
  }

  return (
    <div className={styles.page}>
      <ChartFilterBar
        values={draft}
        deviceOptions={deviceOptions}
        onChange={setDraft}
        onFilter={() => {
          const current = createDefaultChartFilter()
          const next = {
            ...draft,
            toDate: current.toDate,
            toTime: current.toTime,
          }
          setDraft(next)
          setApplied(next)
        }}
        onReset={() => {
          const defaultFilter = createDefaultChartFilter()
          setDraft(defaultFilter)
          setApplied(defaultFilter)
        }}
        lockEndToNow
      />

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      {chartType === 'temperature' ? (
        <LineChartCard
          title="Biểu đồ nhiệt độ động cơ / ổ bi đang vận hành"
          yLabel="Nhiệt độ (độ C)"
          xLabel="Thời gian"
          data={chartData}
          series={series}
          yDomain={[0, 40]}
          height={540}
        />
      ) : chartType === 'current' ? (
        <LineChartCard
          title="Biểu đồ dòng điện theo thời gian"
          yLabel="Dòng điện (A)"
          xLabel="Thời gian"
          data={chartData}
          series={series}
          yDomain={[0, 40]}
          height={540}
        />
      ) : (
        <LineChartCard
          title="Biểu đồ mực nước sông và bể xả theo thời gian"
          yLabel="Mực nước (m)"
          xLabel="Thời gian"
          data={chartData}
          series={series}
          yDomain={waterLevelDomain}
          height={540}
        />
      )}
    </div>
  )
}
