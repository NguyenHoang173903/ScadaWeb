import { useState } from 'react'
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
import type { LegendPayload } from 'recharts'
import styles from './LineChartCard.module.css'
import type { LineChartCardProps, LineChartSeries } from './types'

function isAllowedSeries(item: LineChartSeries) {
  return item.showDot === false
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

  const actualSeries = series.filter((item) => !isAllowedSeries(item))
  const allowedSeries = series.filter(isAllowedSeries)
  const useTwoRowLegend = actualSeries.length > 0 && allowedSeries.length > 0

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
      <h2 className={styles.title}>{title}</h2>

      <div className={styles.chartWrap} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 12, right: 24, left: 8, bottom: useTwoRowLegend ? 64 : 40 }}
          >
            <CartesianGrid strokeDasharray="4 4" stroke="#d1d5db" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#4b5563', fontSize: 12 }}
              tickMargin={8}
              label={{
                value: xLabel,
                position: 'insideBottom',
                offset: -18,
                fill: '#374151',
                fontSize: 13,
              }}
            />
            <YAxis
              domain={yDomain}
              tick={{ fill: '#4b5563', fontSize: 12 }}
              tickMargin={6}
              label={{
                value: yLabel,
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                fill: '#374151',
                fontSize: 13,
              }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #d1d5db',
                fontSize: 13,
              }}
            />
            {useTwoRowLegend ? (
              <Legend
                verticalAlign="bottom"
                align="left"
                wrapperStyle={{ paddingTop: 28 }}
                content={() => (
                  <div className={styles.legend}>
                    <div className={styles.legendRow}>{actualSeries.map(renderLegendItem)}</div>
                    <div className={styles.legendRow}>{allowedSeries.map(renderLegendItem)}</div>
                  </div>
                )}
              />
            ) : (
              <Legend
                verticalAlign="bottom"
                align="left"
                wrapperStyle={{ paddingTop: 28 }}
                iconType="circle"
                onClick={(entry) => {
                  const key = String(
                    (entry as LegendPayload & { dataKey?: string | number }).dataKey ?? '',
                  )
                  if (key) toggleSeries(key)
                }}
                formatter={(value, entry) => {
                  const key = String(
                    (entry as LegendPayload & { dataKey?: string | number }).dataKey ?? '',
                  )
                  const isHidden = hiddenKeys.has(key)
                  return (
                    <span
                      className={isHidden ? styles.legendItemHidden : styles.legendItem}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          if (key) toggleSeries(key)
                        }
                      }}
                    >
                      {value}
                    </span>
                  )
                }}
              />
            )}
            {series.map((item) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={item.color}
                strokeWidth={2.5}
                hide={hiddenKeys.has(item.key)}
                dot={
                  item.showDot === false
                    ? false
                    : { r: 4, strokeWidth: 0, fill: item.color }
                }
                activeDot={item.showDot === false ? false : { r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export type { LineChartCardProps, LineChartPoint, LineChartSeries } from './types'
