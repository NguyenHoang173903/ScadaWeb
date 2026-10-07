import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import styles from './LineChartCard.module.css'
import type { LineChartCardProps, LineChartSeries } from './types'

function isAllowedSeries(item: LineChartSeries) {
  return item.showDot === false
}

type ChartLayout = 'desktop' | 'tablet' | 'mobile'

function getChartLayout(): ChartLayout {
  if (typeof window === 'undefined') return 'desktop'
  if (window.matchMedia('(max-width: 767px)').matches) return 'mobile'
  if (window.matchMedia('(max-width: 1279px)').matches) return 'tablet'
  return 'desktop'
}

export function LineChartCard({
  title,
  xLabel = 'Thời gian',
  yLabel = 'Nhiệt độ (độ C)',
  data,
  series,
  yDomain = [0, 40],
  height = 520,
}: LineChartCardProps) {
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(() => new Set())
  const [layout, setLayout] = useState<ChartLayout>(getChartLayout)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)')
    const tablet = window.matchMedia('(max-width: 1279px)')
    const onChange = () => {
      const next = getChartLayout()
      setLayout(next)
      if (next === 'desktop') setZoom(1)
    }
    onChange()
    mobile.addEventListener('change', onChange)
    tablet.addEventListener('change', onChange)
    return () => {
      mobile.removeEventListener('change', onChange)
      tablet.removeEventListener('change', onChange)
    }
  }, [])

  const actualSeries = series.filter((item) => !isAllowedSeries(item))
  const allowedSeries = series.filter(isAllowedSeries)
  const useTwoRowLegend = actualSeries.length > 0 && allowedSeries.length > 0
  const normalizedData = useMemo(() => {
    const rows = data.map((point) => ({ ...point }))

    for (const item of series.filter(isAllowedSeries)) {
      let lastValue: string | number | null | undefined
      for (const row of rows) {
        if (row[item.key] != null) lastValue = row[item.key]
        else if (lastValue != null) row[item.key] = lastValue
      }

      let nextValue: string | number | null | undefined
      for (let index = rows.length - 1; index >= 0; index -= 1) {
        const row = rows[index]
        if (row[item.key] != null) nextValue = row[item.key]
        else if (nextValue != null) row[item.key] = nextValue
      }
    }

    return rows
  }, [data, series])
  const xTicks = useMemo(() => {
    const maxTicks = layout === 'mobile' ? 5 : layout === 'tablet' ? 6 : 7
    if (data.length <= maxTicks) return data.map((point) => point.time)

    return Array.from({ length: maxTicks }, (_, index) => {
      const dataIndex = Math.round((index * (data.length - 1)) / (maxTicks - 1))
      return data[dataIndex].time
    })
  }, [data, layout])

  const compact = layout !== 'desktop'
  const fittedHeight = layout === 'mobile' ? 460 : layout === 'tablet' ? 520 : height
  const tickFontSize = layout === 'mobile' ? 10 : layout === 'tablet' ? 11 : 12
  const zoomOut = () => setZoom((value) => Math.max(1, Number((value - 0.25).toFixed(2))))
  const zoomIn = () => setZoom((value) => Math.min(2.5, Number((value + 0.25).toFixed(2))))

  const toggleSeries = (dataKey: string) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(dataKey)) next.delete(dataKey)
      else next.add(dataKey)
      return next
    })
  }

  const renderLegendItem = (item: LineChartSeries) => {
    const isHidden = hiddenKeys.has(item.key)
    return (
      <button
        key={item.key}
        type="button"
        className={isHidden ? styles.legendItemHidden : styles.legendItem}
        onClick={() => toggleSeries(item.key)}
      >
        <span className={styles.legendSwatch} style={{ background: item.color }} />
        <span>{item.label}</span>
      </button>
    )
  }

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {compact ? (
          <div className={styles.zoomControls} aria-label="Điều khiển kích thước đồ thị">
            <button type="button" onClick={zoomOut} disabled={zoom <= 1} aria-label="Thu nhỏ đồ thị">
              −
            </button>
            <button type="button" onClick={() => setZoom(1)} className={styles.fitButton}>
              Vừa khung
            </button>
            <button type="button" onClick={zoomIn} disabled={zoom >= 2.5} aria-label="Phóng to đồ thị">
              +
            </button>
          </div>
        ) : null}
      </div>

      <div className={styles.chartViewport}>
        <div
          className={styles.chartCanvas}
          style={{
            width: compact ? `${zoom * 100}%` : '100%',
            height: compact ? fittedHeight * zoom : fittedHeight,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={normalizedData}
            margin={{
              top: 12,
              right: compact ? 14 : 24,
              left: compact ? 0 : 8,
              bottom: useTwoRowLegend ? 64 : 40,
            }}
          >
            <CartesianGrid strokeDasharray="4 4" stroke="#d1d5db" />
            <XAxis
              dataKey="time"
              ticks={xTicks}
              tick={{ fill: '#4b5563', fontSize: tickFontSize }}
              tickMargin={8}
              label={{
                value: xLabel,
                position: 'insideBottom',
                offset: -18,
                fill: '#374151',
                fontSize: tickFontSize + 1,
              }}
            />
            <YAxis
              domain={yDomain}
              tick={{ fill: '#4b5563', fontSize: tickFontSize }}
              tickMargin={6}
              label={{
                value: yLabel,
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                fill: '#374151',
                fontSize: tickFontSize + 1,
              }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #d1d5db',
                fontSize: 13,
              }}
            />
            <Legend
              verticalAlign="bottom"
              align="left"
              wrapperStyle={{ paddingTop: 28 }}
              content={() => (
                <div className={styles.legend}>
                  <div className={styles.legendRow}>{actualSeries.map(renderLegendItem)}</div>
                  {allowedSeries.length > 0 ? (
                    <div className={styles.legendRow}>{allowedSeries.map(renderLegendItem)}</div>
                  ) : null}
                </div>
              )}
            />
            {series.map((item) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={item.color}
                strokeWidth={2.5}
                hide={hiddenKeys.has(item.key)}
                dot={false}
                activeDot={false}
                connectNulls
              />
            ))}
          </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}

export type { LineChartCardProps, LineChartPoint, LineChartSeries } from './types'
