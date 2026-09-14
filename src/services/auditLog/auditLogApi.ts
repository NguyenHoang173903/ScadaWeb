import { apiClient } from '@/services/api/client'
import type { PaginationResult } from '@/types'
import type {
  AuditLogDto,
  AuditLogListResponse,
  AuditLogQuery,
} from './types'

/** BE system audit (scada.system_audit_logs). */
type SystemAuditLogDto = {
  id: number
  timestamp: string
  action: string
  eventType: string
  status: string
  userId?: number | null
  userName?: string | null
  description?: string | null
  module?: string | null
  endpoint?: string | null
  httpMethod?: string | null
  httpStatusCode?: number | null
  ipAddress?: string | null
  userAgent?: string | null
  entityType?: string | null
  entityId?: string | null
  correlationId?: string | null
  additionalData?: string | null
}

function mapSystemAudit(row: SystemAuditLogDto): AuditLogDto {
  const isAuth = /login|logout|password|auth/i.test(`${row.action} ${row.eventType}`)
  return {
    id: String(row.id),
    category: isAuth ? 'login' : 'system',
    eventType: row.action || row.eventType,
    username: row.userName || 'unknown',
    title: row.action || row.eventType,
    detail: row.description || '',
    occurredAt: row.timestamp,
    endedAt: null,
    source: row.module || undefined,
    userAgent: row.userAgent || undefined,
    metadata: {
      status: row.status,
      eventType: row.eventType,
      ipAddress: row.ipAddress,
      endpoint: row.endpoint,
      httpMethod: row.httpMethod,
      httpStatusCode: row.httpStatusCode,
    },
  }
}

function buildQueryPath(query: AuditLogQuery = {}) {
  const params = new URLSearchParams()
  if (query.username) params.set('userName', query.username)
  if (query.from) params.set('fromUtc', `${query.from}T00:00:00.000Z`)
  if (query.to) params.set('toUtc', `${query.to}T23:59:59.999Z`)
  if (query.page != null) params.set('pageNumber', String(query.page))
  if (query.pageSize != null) params.set('pageSize', String(query.pageSize))
  // Login tab: Authentication event type on BE
  if (query.category === 'login') params.set('eventType', 'Authentication')
  const qs = params.toString()
  return qs ? `/system-audit-logs?${qs}` : '/system-audit-logs'
}

/**
 * Client chỉ đọc. BE tự ghi audit — không POST từ FE.
 * Giữ tên apiCreateAuditLog để tương thích; no-op khi gọi.
 */
export async function apiCreateAuditLog(
  payload: import('./types').CreateAuditLogPayload,
): Promise<AuditLogDto> {
  return {
    id: payload.id ?? `local-${Date.now()}`,
    category: payload.category,
    eventType: payload.eventType,
    username: payload.username,
    title: payload.title,
    detail: payload.detail,
    occurredAt: payload.occurredAt,
    endedAt: payload.endedAt,
    source: payload.source,
    userAgent: payload.userAgent,
    metadata: payload.metadata,
  }
}

export async function apiListAuditLogs(query: AuditLogQuery = {}): Promise<AuditLogListResponse> {
  const page = await apiClient.get<PaginationResult<SystemAuditLogDto>>(buildQueryPath(query))
  const items = (page.items ?? []).map(mapSystemAudit)
  if (query.keyword?.trim()) {
    const kw = query.keyword.trim().toLowerCase()
    const filtered = items.filter((item) =>
      [item.title, item.detail, item.username, item.eventType].join(' ').toLowerCase().includes(kw),
    )
    return { items: filtered, total: filtered.length }
  }
  return { items, total: page.totalCount ?? items.length }
}
