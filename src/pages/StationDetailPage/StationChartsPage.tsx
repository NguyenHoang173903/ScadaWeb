import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import {
  ChartFilterBar,
  type ChartFilterValues,
} from '@/components/common/ChartFilterBar'
import { LineChartCard } from '@/components/common/LineChartCard'
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

export function StationChartsPage() {
  const { stationId = '', chartType } = useParams()
  const [draft, setDraft] = useState<ChartFilterValues>(DEFAULT_CHART_FILTER)
  const [, setApplied] = useState<ChartFilterValues>(DEFAULT_CHART_FILTER)

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
        deviceOptions={CHART_DEVICE_OPTIONS}
        onChange={setDraft}
        onFilter={() => setApplied(draft)}
        onReset={() => {
          setDraft(DEFAULT_CHART_FILTER)
          setApplied(DEFAULT_CHART_FILTER)
        }}
      />

      {chartType === 'temperature' ? (
        <LineChartCard
          title="Biểu đồ nhiệt độ động cơ / ổ bi đang vận hành"
          yLabel="Nhiệt độ (độ C)"
          xLabel="Thời gian"
          data={TEMPERATURE_CHART_DATA}
          series={TEMPERATURE_SERIES}
          yDomain={[0, 40]}
          height={540}
        />
      ) : (
        <LineChartCard
          title="Biểu đồ dòng điện theo thời gian"
          yLabel="Dòng điện (A)"
          xLabel="Thời gian"
          data={CURRENT_CHART_DATA}
          series={CURRENT_SERIES}
          yDomain={[0, 40]}
          height={540}
        />
      )}
    </div>
  )
}
