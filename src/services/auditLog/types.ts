/** Nhật ký hệ thống (feature 3.1) — hợp đồng frontend, backend sẽ gắn sau. */

export type AuditLogCategory = 'login' | 'system'

export type AuthEventType =
  | 'login'
  | 'logout'
  | 'login-failed'
  | 'session-expired'
  | 'password-changed'

export type AuditLogDto = {
  id: string
  category: AuditLogCategory
  eventType: string
  username: string
  title: string
  detail: string
  occurredAt: string
  endedAt?: string | null
  source?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

export type CreateAuditLogPayload = Omit<AuditLogDto, 'id'> & { id?: string }

export type AuditLogQuery = {
  category?: AuditLogCategory
  eventType?: string
  username?: string
  from?: string
  to?: string
  keyword?: string
  page?: number
  pageSize?: number
}

export type AuditLogListResponse = {
  items: AuditLogDto[]
  total: number
}

export type ReportAuthEventInput = {
  eventType: AuthEventType
  username: string
  detail?: string
  metadata?: Record<string, unknown>
}
