import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import {
  ChartFilterBar,
  type ChartFilterValues,
} from '@/components/common/ChartFilterBar'
import { LineChartCard, type LineChartPoint } from '@/components/common/LineChartCard'
import { isApiError } from '@/services/api/http'
import { getChartDevices, getChartHistory } from '@/services/stations/stationsApi'
import {
  CHART_DEVICE_OPTIONS,
  CURRENT_CHART_DATA,
  CURRENT_SERIES,
  DEFAULT_CHART_FILTER,
  TEMPERATURE_CHART_DATA,
  TEMPERATURE_SERIES,
  type ChartTabId,
} from './chartsMock'
import styles from './ChartsPage.module.css'

function isChartTab(value: string | undefined): value is ChartTabId {
  return value === 'temperature' || value === 'current'
}

function toIsoRange(filter: ChartFilterValues) {
  const from = new Date(`${filter.fromDate}T${filter.fromTime || '00:00:00'}`)
  const to = new Date(`${filter.toDate}T${filter.toTime || '23:59:59'}`)
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

export function StationChartsPage() {
  const { stationId = '', chartType } = useParams()
  const numericStation = /^\d+$/.test(stationId)
  const [draft, setDraft] = useState<ChartFilterValues>(DEFAULT_CHART_FILTER)
  const [applied, setApplied] = useState<ChartFilterValues>(DEFAULT_CHART_FILTER)
  const [deviceOptions, setDeviceOptions] = useState(CHART_DEVICE_OPTIONS)
  const [chartData, setChartData] = useState<LineChartPoint[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!numericStation) return
    void getChartDevices(Number(stationId))
      .then((devices) => {
        if (devices.length === 0) return
        const options = devices.map((d) => ({ value: String(d.id), label: d.name }))
        setDeviceOptions(options)
        setDraft((prev) => ({ ...prev, deviceId: options[0].value }))
        setApplied((prev) => ({ ...prev, deviceId: options[0].value }))
      })
      .catch(() => {
        // Keep mock options.
      })
  }, [stationId, numericStation])

  useEffect(() => {
    if (!chartType || !isChartTab(chartType)) return
    if (!numericStation) {
      setChartData(chartType === 'temperature' ? TEMPERATURE_CHART_DATA : CURRENT_CHART_DATA)
      return
    }

    const deviceId = Number(applied.deviceId)
    if (!Number.isFinite(deviceId)) return

    let cancelled = false
    void (async () => {
      try {
        const range = toIsoRange(applied)
        const result = await getChartHistory(Number(stationId), deviceId, chartType, {
          from: range.from,
          to: range.to,
        })
        if (cancelled) return

        const byTime = new Map<string, LineChartPoint>()
        for (const series of result.series ?? []) {
          for (const point of series.points ?? []) {
            const time = formatAxisTime(point.timestamp)
            const row = byTime.get(time) ?? { time }
            row[series.key] = point.value
            byTime.set(time, row)
          }
        }
        setChartData([...byTime.values()])
        setError('')
      } catch (err) {
        if (cancelled) return
        setChartData([])
        setError(isApiError(err) ? err.message : 'Không tải được đồ thị.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [stationId, numericStation, chartType, applied])

  const series = useMemo(
    () => (chartType === 'current' ? CURRENT_SERIES : TEMPERATURE_SERIES),
    [chartType],
  )

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
        onFilter={() => setApplied(draft)}
        onReset={() => {
          setDraft(DEFAULT_CHART_FILTER)
          setApplied(DEFAULT_CHART_FILTER)
        }}
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
      ) : (
        <LineChartCard
          title="Biểu đồ dòng điện theo thời gian"
          yLabel="Dòng điện (A)"
          xLabel="Thời gian"
          data={chartData}
          series={series}
          yDomain={[0, 40]}
          height={540}
        />
      )}
    </div>
  )
}
