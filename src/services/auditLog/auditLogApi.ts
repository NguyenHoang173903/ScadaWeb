/**
 * Client nhật ký hệ thống.
 *
 * Endpoints (backend sẽ cập nhật sau):
 *   POST /audit-logs
 *   GET  /audit-logs?category=&from=&to=&keyword=&page=&pageSize=
 */
import { apiClient } from '@/services/api/client'
import type {
  AuditLogDto,
  AuditLogListResponse,
  AuditLogQuery,
  CreateAuditLogPayload,
} from './types'

function buildQueryPath(query: AuditLogQuery = {}) {
  const params = new URLSearchParams()
  if (query.category) params.set('category', query.category)
  if (query.eventType) params.set('eventType', query.eventType)
  if (query.username) params.set('username', query.username)
  if (query.from) params.set('from', query.from)
  if (query.to) params.set('to', query.to)
  if (query.keyword) params.set('keyword', query.keyword)
  if (query.page != null) params.set('page', String(query.page))
  if (query.pageSize != null) params.set('pageSize', String(query.pageSize))
  const qs = params.toString()
  return qs ? `/audit-logs?${qs}` : '/audit-logs'
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function asItems(value: unknown): AuditLogDto[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is AuditLogDto => {
    if (!item || typeof item !== 'object') return false
    return typeof (item as AuditLogDto).id === 'string'
  })
}

export function normalizeAuditLogList(payload: unknown): AuditLogListResponse {
  if (Array.isArray(payload)) {
    const items = asItems(payload)
    return { items, total: items.length }
  }

  const root = asRecord(payload)
  if (!root) return { items: [], total: 0 }

  const inner = asRecord(root.data) ?? root
  const items = asItems(inner.items ?? inner.logs ?? inner.data)
  const totalRaw = inner.total ?? inner.count ?? items.length
  const total = typeof totalRaw === 'number' ? totalRaw : items.length
  return { items, total }
}

export async function apiCreateAuditLog(payload: CreateAuditLogPayload): Promise<AuditLogDto> {
  return apiClient.post<AuditLogDto>('/audit-logs', payload, { signal: AbortSignal.timeout(4000) })
}

export async function apiListAuditLogs(query: AuditLogQuery = {}): Promise<AuditLogListResponse> {
  const payload = await apiClient.get<unknown>(buildQueryPath(query), {
    signal: AbortSignal.timeout(4000),
  })
  return normalizeAuditLogList(payload)
}
