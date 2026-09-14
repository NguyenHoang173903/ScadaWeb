import { apiClient } from '@/services/api/client'
import type { PaginationResult } from '@/types'

export type StationDto = {
  id: number
  code: string
  name: string
  isActive: boolean
}

export type StationDetailDto = {
  id: number
  code: string
  name: string
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  description?: string | null
  isActive: boolean
}

export type DeviceMonitorItemDto = {
  deviceId: number
  name: string
  ratedPowerKw?: number | null
  status: string
  windingTempActual: { a?: number | null; b?: number | null; c?: number | null }
  windingTempAllowed: { a?: number | null; b?: number | null; c?: number | null }
  bearingTop: { actual?: number | null; allowed?: number | null }
  bearingBottom: { actual?: number | null; allowed?: number | null }
  waterLevel: { river?: number | null; basin?: number | null }
  runtime: { instantH?: number | null; totalH?: number | null }
  electrical: {
    voltageRs?: number | null
    voltageSt?: number | null
    voltageTr?: number | null
    currentA?: number | null
    powerFactor?: number | null
    frequencyHz?: number | null
    powerKw?: number | null
    energyKwh?: number | null
  }
}

export type SchematicPumpDto = {
  id: number
  deviceId: number
  code: string
  label: string
  powerKw: number
  mccbCode: string
  motorStatus: string
  kdmStatus: string
  lockStatus: string
  i1?: number | null
  i2?: number | null
  i3?: number | null
  v1?: number | null
  v2?: number | null
  v3?: number | null
  currentA?: number | null
  runtimeH?: number | null
}

export type StationSchematicDto = {
  station: { id: number; code: string; name: string }
  layout: { mba: string; msb: string; mdbs: string[] }
  pumps: SchematicPumpDto[]
}

export type StationElectricalDto = {
  station: { id: number; code: string; name: string }
  items: Array<{
    equipment: { id: number; code: string; name: string }
    parameters: Array<{
      key: string
      label: string
      tagId?: number | null
      code?: string | null
      value?: number | null
      unit?: string | null
      timestamp?: string | null
    }>
  }>
}

export type StationChartDeviceOptionDto = { id: number; name: string }

export type StationChartHistoryDto = {
  stationId: number
  deviceId: number
  chart: string
  interval: string
  from: string
  to: string
  series: Array<{
    key: string
    label: string
    role: string
    tagId?: number | null
    tagCode?: string | null
    points: Array<{ timestamp: string; value: number }>
  }>
}

export type StationEventHistoryRowDto = {
  id: number
  startTime: string
  endTime?: string | null
  type: string
  title: string
  description?: string | null
  deviceId?: number | null
  deviceName?: string | null
  tagId?: number | null
  tagName?: string | null
  username?: string | null
  eventTypeId?: number | null
  isAcknowledged: boolean
}

export type WaterLevelReportRowDto = {
  time: string
  riverLevel?: number | null
  discharge1?: number | null
  discharge2?: number | null
  discharge3?: number | null
  discharge4?: number | null
  discharge5?: number | null
  discharge6?: number | null
  discharge7?: number | null
  discharge8?: number | null
  discharge9?: number | null
  discharge10?: number | null
}

export type PumpTemperatureReportRowDto = {
  time: string
  deviceId: number
  pump: string
  tempA?: number | null
  tempB?: number | null
  tempC?: number | null
  bearingBottom?: number | null
  bearingTop?: number | null
}

export async function listStations(params?: { keyword?: string; isActive?: boolean }) {
  const search = new URLSearchParams()
  if (params?.keyword) search.set('keyword', params.keyword)
  if (params?.isActive != null) search.set('isActive', String(params.isActive))
  search.set('pageSize', '200')
  const qs = search.toString()
  return apiClient.get<PaginationResult<StationDto>>(`/stations?${qs}`)
}

export async function getStation(id: number) {
  return apiClient.get<StationDetailDto>(`/stations/${id}`)
}

export async function getDeviceMonitor(stationId: number) {
  return apiClient.get<{ items: DeviceMonitorItemDto[] }>(
    `/stations/${stationId}/device-monitor?pageSize=100`,
  )
}

export async function getStationSchematic(stationId: number) {
  return apiClient.get<StationSchematicDto>(`/stations/${stationId}/schematic`)
}

export async function getStationElectrical(stationId: number) {
  return apiClient.get<StationElectricalDto>(`/stations/${stationId}/electrical`)
}

export async function getChartDevices(stationId: number) {
  return apiClient.get<StationChartDeviceOptionDto[]>(`/stations/${stationId}/charts/devices`)
}

export async function getChartHistory(
  stationId: number,
  deviceId: number,
  chart: 'temperature' | 'current',
  query: { from: string; to: string; interval?: string },
) {
  const search = new URLSearchParams({
    from: query.from,
    to: query.to,
  })
  if (query.interval) search.set('interval', query.interval)
  return apiClient.get<StationChartHistoryDto>(
    `/stations/${stationId}/devices/${deviceId}/charts/${chart}/history?${search}`,
  )
}

export async function getEventDevices(stationId: number) {
  return apiClient.get<StationChartDeviceOptionDto[]>(`/stations/${stationId}/events/devices`)
}

export async function getEventHistory(
  stationId: number,
  query: {
    category?: string
    deviceId?: number
    fromDate?: string
    toDate?: string
    keyword?: string
    pageNumber?: number
    pageSize?: number
  },
) {
  const search = new URLSearchParams()
  if (query.category) search.set('category', query.category)
  if (query.deviceId != null) search.set('deviceId', String(query.deviceId))
  if (query.fromDate) search.set('fromDate', query.fromDate)
  if (query.toDate) search.set('toDate', query.toDate)
  if (query.keyword) search.set('keyword', query.keyword)
  if (query.pageNumber != null) search.set('pageNumber', String(query.pageNumber))
  if (query.pageSize != null) search.set('pageSize', String(query.pageSize))
  return apiClient.get<PaginationResult<StationEventHistoryRowDto>>(
    `/stations/${stationId}/events/history?${search}`,
  )
}

export async function getWaterLevelReport(
  stationId: number,
  query: {
    reportDate?: string
    startTime?: string
    endTime?: string
    pageNumber?: number
    pageSize?: number
  },
) {
  const search = new URLSearchParams()
  if (query.reportDate) search.set('reportDate', query.reportDate)
  if (query.startTime) search.set('startTime', query.startTime)
  if (query.endTime) search.set('endTime', query.endTime)
  if (query.pageNumber != null) search.set('pageNumber', String(query.pageNumber))
  if (query.pageSize != null) search.set('pageSize', String(query.pageSize))
  return apiClient.get<PaginationResult<WaterLevelReportRowDto>>(
    `/stations/${stationId}/reports/water-levels?${search}`,
  )
}

export async function getPumpTemperatureReport(
  stationId: number,
  query: {
    reportDate?: string
    startTime?: string
    endTime?: string
    deviceId?: number
    pageNumber?: number
    pageSize?: number
  },
) {
  const search = new URLSearchParams()
  if (query.reportDate) search.set('reportDate', query.reportDate)
  if (query.startTime) search.set('startTime', query.startTime)
  if (query.endTime) search.set('endTime', query.endTime)
  if (query.deviceId != null) search.set('deviceId', String(query.deviceId))
  if (query.pageNumber != null) search.set('pageNumber', String(query.pageNumber))
  if (query.pageSize != null) search.set('pageSize', String(query.pageSize))
  return apiClient.get<PaginationResult<PumpTemperatureReportRowDto>>(
    `/stations/${stationId}/reports/pump-temperatures?${search}`,
  )
}

export async function getReportDevices(stationId: number) {
  return apiClient.get<StationChartDeviceOptionDto[]>(`/stations/${stationId}/reports/devices`)
}
