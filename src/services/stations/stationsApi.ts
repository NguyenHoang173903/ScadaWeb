import { apiClient } from '@/services/api/client'
import { downloadBinary } from '@/services/api/http'
import type { PaginationResult } from '@/types'

export type StationDto = {
  id: number
  code: string
  name: string
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  description?: string | null
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

export type UpdateStationPayload = {
  name?: string
  address?: string
  latitude?: number | null
  longitude?: number | null
  description?: string
  isActive?: boolean
}

export type StationReportColumnDto = {
  key: string
  header: string
  tagId?: number | null
  tagCode?: string | null
}

export type StationReportTableDto = {
  stationId: number
  deviceId: number
  deviceName: string
  deviceCode: string
  interval: string
  from: string
  to: string
  columns: StationReportColumnDto[]
  items: Array<{ time: string; values: Record<string, number | null> }>
  totalCount: number
  pageNumber: number
  pageSize: number
}

export type ActiveAlarmRowDto = {
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
  isAcknowledged: boolean
  stationId?: number | null
}

export type DeviceMonitorItemDto = {
  deviceId: number
  /** Chỉ số bơm 1..10 khi BE expose (ưu tiên). */
  pumpIndex?: number | null
  name: string
  code?: string | null
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

export type StationOperatorDto = {
  id: number
  fullName: string
  dateOfBirth?: string | null
  position?: string | null
  educationLevel?: string | null
  employeeCode?: string | null
  phone?: string | null
  shiftStartTime?: string | null
}

export type StationTeamDto = {
  stationId: number
  stationCode: string
  operators: StationOperatorDto[]
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

type DeviceMonitorResponse = { items: DeviceMonitorItemDto[] }

const deviceMonitorCache = new Map<number, DeviceMonitorResponse>()
const schematicCache = new Map<number, StationSchematicDto>()
const electricalCache = new Map<number, StationElectricalDto>()

export function peekDeviceMonitor(stationId: number) {
  return deviceMonitorCache.get(stationId)
}

export function peekStationSchematic(stationId: number) {
  return schematicCache.get(stationId)
}

export function peekStationElectrical(stationId: number) {
  return electricalCache.get(stationId)
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

export async function updateStation(id: number, payload: UpdateStationPayload) {
  return apiClient.put<StationDetailDto>(`/stations/${id}`, payload)
}

export async function getDeviceMonitor(stationId: number) {
  const result = await apiClient.get<DeviceMonitorResponse>(
    `/stations/${stationId}/device-monitor?pageSize=100`,
  )
  deviceMonitorCache.set(stationId, result)
  return result
}

export async function getStationSchematic(stationId: number) {
  const result = await apiClient.get<StationSchematicDto>(`/stations/${stationId}/schematic`)
  schematicCache.set(stationId, result)
  return result
}

export async function getStationElectrical(stationId: number) {
  const result = await apiClient.get<StationElectricalDto>(`/stations/${stationId}/electrical`)
  electricalCache.set(stationId, result)
  return result
}

export async function getStationTeam(stationId: number) {
  return apiClient.get<StationTeamDto>(`/stations/${stationId}/team`)
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

export async function getReportTable(
  stationId: number,
  query: {
    deviceId: number
    reportDate?: string
    startTime?: string
    endTime?: string
    pageNumber?: number
    pageSize?: number
  },
) {
  const search = new URLSearchParams()
  search.set('deviceId', String(query.deviceId))
  if (query.reportDate) search.set('reportDate', query.reportDate)
  if (query.startTime) search.set('startTime', query.startTime)
  if (query.endTime) search.set('endTime', query.endTime)
  if (query.pageNumber != null) search.set('pageNumber', String(query.pageNumber))
  if (query.pageSize != null) search.set('pageSize', String(query.pageSize))
  return apiClient.get<StationReportTableDto>(
    `/stations/${stationId}/reports/table?${search}`,
  )
}

export async function exportReportTableExcel(
  stationId: number,
  query: {
    deviceId: number
    reportDate?: string
    startTime?: string
    endTime?: string
  },
) {
  const search = new URLSearchParams()
  search.set('deviceId', String(query.deviceId))
  if (query.reportDate) search.set('reportDate', query.reportDate)
  if (query.startTime) search.set('startTime', query.startTime)
  if (query.endTime) search.set('endTime', query.endTime)
  await downloadBinary(
    `/stations/${stationId}/reports/table/export?${search}`,
    `BaoCao_${stationId}.xlsx`,
  )
}

export async function exportEventHistoryExcel(
  stationId: number,
  query: {
    category?: string
    deviceId?: number
    fromDate?: string
    toDate?: string
    keyword?: string
  },
) {
  const search = new URLSearchParams()
  if (query.category) search.set('category', query.category)
  if (query.deviceId != null) search.set('deviceId', String(query.deviceId))
  if (query.fromDate) search.set('fromDate', query.fromDate)
  if (query.toDate) search.set('toDate', query.toDate)
  if (query.keyword) search.set('keyword', query.keyword)
  await downloadBinary(
    `/stations/${stationId}/events/history/export?${search}`,
    `SuKien_${stationId}.xlsx`,
  )
}

export async function getActiveAlarms(
  stationId: number,
  query: {
    deviceId?: number
    isAcknowledged?: boolean
    type?: string
    keyword?: string
    pageNumber?: number
    pageSize?: number
  },
) {
  const search = new URLSearchParams()
  if (query.deviceId != null) search.set('deviceId', String(query.deviceId))
  if (query.isAcknowledged != null) search.set('isAcknowledged', String(query.isAcknowledged))
  if (query.type) search.set('type', query.type)
  if (query.keyword) search.set('keyword', query.keyword)
  if (query.pageNumber != null) search.set('pageNumber', String(query.pageNumber))
  if (query.pageSize != null) search.set('pageSize', String(query.pageSize))
  return apiClient.get<PaginationResult<ActiveAlarmRowDto>>(
    `/stations/${stationId}/alarms/active?${search}`,
  )
}

export async function exportActiveAlarmsExcel(
  stationId: number,
  query: {
    deviceId?: number
    isAcknowledged?: boolean
    type?: string
    keyword?: string
  },
) {
  const search = new URLSearchParams()
  if (query.deviceId != null) search.set('deviceId', String(query.deviceId))
  if (query.isAcknowledged != null) search.set('isAcknowledged', String(query.isAcknowledged))
  if (query.type) search.set('type', query.type)
  if (query.keyword) search.set('keyword', query.keyword)
  await downloadBinary(
    `/stations/${stationId}/alarms/active/export?${search}`,
    `LoiTonTai_${stationId}.xlsx`,
  )
}
