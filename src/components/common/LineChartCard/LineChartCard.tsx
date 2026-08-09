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
import type { LineChartCardProps } from './types'

export function LineChartCard({
  title,
  xLabel = 'Thời gian',
  yLabel = 'Nhiệt độ (độ C)',
  data,
  series,
  yDomain = [0, 40],
  height = 420,
}: LineChartCardProps) {
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(() => new Set())

  const toggleSeries = (dataKey: string) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(dataKey)) next.delete(dataKey)
      else next.add(dataKey)
      return next
    })
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>{title}</h2>

      <div className={styles.chartWrap} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 24, left: 8, bottom: 28 }}>
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
            <Legend
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: 18 }}
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
