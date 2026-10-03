import { keepPreviousData, queryOptions, type QueryClient } from '@tanstack/react-query'
import {
  getActiveAlarms,
  getChartDevices,
  getChartHistory,
  getDeviceMonitor,
  getEventDevices,
  getEventHistory,
  getReportDevices,
  getReportTable,
  getStationElectrical,
  getStationSchematic,
  getStationTeam,
  peekDeviceMonitor,
  peekStationElectrical,
  peekStationSchematic,
  type StationChartHistoryDto,
} from './stationsApi'

const OVERVIEW_STALE_TIME = 5_000
const CHART_STALE_TIME = 30_000
const CACHE_TIME = 15 * 60_000

export const stationQueryKeys = {
  root: ['stations'] as const,
  station: (stationId: number) => [...stationQueryKeys.root, stationId] as const,
  schematic: (stationId: number) =>
    [...stationQueryKeys.station(stationId), 'schematic'] as const,
  electrical: (stationId: number) =>
    [...stationQueryKeys.station(stationId), 'electrical'] as const,
  monitor: (stationId: number) =>
    [...stationQueryKeys.station(stationId), 'device-monitor'] as const,
  chartDevices: (stationId: number) =>
    [...stationQueryKeys.station(stationId), 'chart-devices'] as const,
  charts: (stationId: number) =>
    [...stationQueryKeys.station(stationId), 'charts'] as const,
  chartType: (
    stationId: number,
    deviceId: number,
    chart: 'temperature' | 'current' | 'water',
  ) => [...stationQueryKeys.charts(stationId), deviceId, chart] as const,
  chartHistory: (
    stationId: number,
    deviceId: number,
    chart: 'temperature' | 'current' | 'water',
    from: string,
    to: string,
  ) => [...stationQueryKeys.chartType(stationId, deviceId, chart), from, to] as const,
  reportDevices: (stationId: number) =>
    [...stationQueryKeys.station(stationId), 'report-devices'] as const,
  reports: (stationId: number) =>
    [...stationQueryKeys.station(stationId), 'reports'] as const,
  reportTable: (
    stationId: number,
    query: {
      deviceId: number
      reportDate: string
      startTime: string
      endTime: string
      pageNumber: number
      pageSize: number
      refreshTick: number
    },
  ) =>
    [
      ...stationQueryKeys.reports(stationId),
      query.deviceId,
      query.reportDate,
      query.startTime,
      query.endTime,
      query.pageNumber,
      query.pageSize,
      query.refreshTick,
    ] as const,
  eventDevices: (stationId: number) =>
    [...stationQueryKeys.station(stationId), 'event-devices'] as const,
  events: (stationId: number) =>
    [...stationQueryKeys.station(stationId), 'events'] as const,
  team: (stationId: number) =>
    [...stationQueryKeys.station(stationId), 'team'] as const,
  activeAlarms: (stationId: number) =>
    [...stationQueryKeys.station(stationId), 'active-alarms'] as const,
}

export function stationSchematicQuery(stationId: number) {
  return queryOptions({
    queryKey: stationQueryKeys.schematic(stationId),
    queryFn: () => getStationSchematic(stationId),
    initialData: () => peekStationSchematic(stationId),
    staleTime: OVERVIEW_STALE_TIME,
    gcTime: CACHE_TIME,
  })
}

export function stationElectricalQuery(stationId: number) {
  return queryOptions({
    queryKey: stationQueryKeys.electrical(stationId),
    queryFn: () => getStationElectrical(stationId),
    initialData: () => peekStationElectrical(stationId),
    staleTime: OVERVIEW_STALE_TIME,
    gcTime: CACHE_TIME,
  })
}

export function stationMonitorQuery(stationId: number) {
  return queryOptions({
    queryKey: stationQueryKeys.monitor(stationId),
    queryFn: () => getDeviceMonitor(stationId),
    initialData: () => peekDeviceMonitor(stationId),
    staleTime: OVERVIEW_STALE_TIME,
    gcTime: CACHE_TIME,
  })
}

export function stationChartDevicesQuery(stationId: number) {
  return queryOptions({
    queryKey: stationQueryKeys.chartDevices(stationId),
    queryFn: () => getChartDevices(stationId),
    staleTime: 5 * 60_000,
    gcTime: CACHE_TIME,
  })
}

export function stationReportDevicesQuery(stationId: number) {
  return queryOptions({
    queryKey: stationQueryKeys.reportDevices(stationId),
    queryFn: () => getReportDevices(stationId),
    staleTime: 5 * 60_000,
    gcTime: CACHE_TIME,
  })
}

export function stationReportTableQuery(
  stationId: number,
  query: {
    deviceId: number
    reportDate: string
    startTime: string
    endTime: string
    pageNumber: number
    pageSize: number
    refreshTick: number
  },
) {
  return queryOptions({
    queryKey: stationQueryKeys.reportTable(stationId, query),
    queryFn: () =>
      getReportTable(stationId, {
        deviceId: query.deviceId,
        reportDate: query.reportDate,
        startTime: query.startTime,
        endTime: query.endTime,
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    gcTime: CACHE_TIME,
  })
}

export function stationEventDevicesQuery(stationId: number) {
  return queryOptions({
    queryKey: stationQueryKeys.eventDevices(stationId),
    queryFn: () => getEventDevices(stationId),
    staleTime: 5 * 60_000,
    gcTime: CACHE_TIME,
  })
}

export function stationEventHistoryQuery(
  stationId: number,
  query: {
    category: string
    deviceId?: number
    fromDate?: string
    toDate?: string
    keyword?: string
    refreshTick: number
  },
) {
  return queryOptions({
    queryKey: [
      ...stationQueryKeys.events(stationId),
      query.category,
      query.deviceId ?? null,
      query.fromDate ?? '',
      query.toDate ?? '',
      query.keyword ?? '',
      query.refreshTick,
    ],
    queryFn: () =>
      getEventHistory(stationId, {
        category: query.category,
        deviceId: query.deviceId,
        fromDate: query.fromDate,
        toDate: query.toDate,
        keyword: query.keyword,
        pageNumber: 1,
        pageSize: 500,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    gcTime: CACHE_TIME,
  })
}

export function stationTeamQuery(stationId: number) {
  return queryOptions({
    queryKey: stationQueryKeys.team(stationId),
    queryFn: () => getStationTeam(stationId),
    staleTime: 15_000,
    gcTime: CACHE_TIME,
    refetchInterval: 15_000,
  })
}

export function stationActiveAlarmsQuery(
  stationId: number,
  query: {
    deviceId?: number
    keyword?: string
    pageNumber: number
    pageSize: number
    refreshTick: number
  },
) {
  return queryOptions({
    queryKey: [
      ...stationQueryKeys.activeAlarms(stationId),
      query.deviceId ?? null,
      query.keyword ?? '',
      query.pageNumber,
      query.pageSize,
      query.refreshTick,
    ],
    queryFn: () =>
      getActiveAlarms(stationId, {
        deviceId: query.deviceId,
        keyword: query.keyword,
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
      }),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    gcTime: CACHE_TIME,
  })
}

export function stationActiveAlarmCarouselQuery(stationId: number) {
  const pageSize = 100

  return queryOptions({
    queryKey: [...stationQueryKeys.activeAlarms(stationId), 'carousel'],
    queryFn: async () => {
      const firstPage = await getActiveAlarms(stationId, {
        pageNumber: 1,
        pageSize,
      })
      const itemsById = new Map(firstPage.items.map((item) => [item.id, item]))
      let pageNumber = 2

      while (itemsById.size < firstPage.totalCount && pageNumber <= firstPage.totalCount + 1) {
        const page = await getActiveAlarms(stationId, { pageNumber, pageSize })
        const previousSize = itemsById.size
        page.items.forEach((item) => itemsById.set(item.id, item))
        if (itemsById.size === previousSize) {
          throw new Error('Không thể tải đầy đủ lỗi đang tồn tại.')
        }
        pageNumber += 1
      }

      if (itemsById.size < firstPage.totalCount) {
        throw new Error('Không thể tải đầy đủ lỗi đang tồn tại.')
      }

      return { ...firstPage, items: [...itemsById.values()] }
    },
    staleTime: 10_000,
    gcTime: CACHE_TIME,
    refetchInterval: 10_000,
  })
}

export function stationChartHistoryQuery(
  stationId: number,
  deviceId: number,
  chart: 'temperature' | 'current' | 'water',
  range: { from: string; to: string },
  placeholderData?: StationChartHistoryDto,
) {
  return queryOptions({
    queryKey: stationQueryKeys.chartHistory(
      stationId,
      deviceId,
      chart,
      range.from,
      range.to,
    ),
    queryFn: () =>
      getChartHistory(stationId, deviceId, chart, {
        from: range.from,
        to: range.to,
      }),
    placeholderData,
    staleTime: CHART_STALE_TIME,
    gcTime: CACHE_TIME,
  })
}

export function getLatestCachedChart(
  client: QueryClient,
  stationId: number,
  deviceId: number,
  chart: 'temperature' | 'current' | 'water',
) {
  const matches = client.getQueriesData<StationChartHistoryDto>({
    queryKey: stationQueryKeys.chartType(stationId, deviceId, chart),
  })
  return matches.find(([, value]) => value != null)?.[1]
}

export async function prefetchStationOverview(client: QueryClient, stationId: number) {
  await Promise.allSettled([
    client.prefetchQuery(stationSchematicQuery(stationId)),
    client.prefetchQuery(stationElectricalQuery(stationId)),
    client.prefetchQuery(stationMonitorQuery(stationId)),
    client.prefetchQuery(stationChartDevicesQuery(stationId)),
    client.prefetchQuery(stationReportDevicesQuery(stationId)),
    client.prefetchQuery(stationEventDevicesQuery(stationId)),
    client.prefetchQuery(stationTeamQuery(stationId)),
  ])
}
