export type LineChartSeries = {
  key: string
  label: string
  color: string
  /** Default true — set false for threshold/limit lines */
  showDot?: boolean
}

export type LineChartPoint = {
  time: string
  [seriesKey: string]: string | number | null
}

export type LineChartCardProps = {
  title: string
  xLabel?: string
  yLabel?: string
  data: LineChartPoint[]
  series: LineChartSeries[]
  yDomain?: [number, number]
  height?: number
}
