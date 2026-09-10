import { endSession, getSessionUsername } from '@/settings/session'
import { apiCreateAuditLog, apiListAuditLogs } from './auditLogApi'
import { appendLocalAuditLog, listLocalAuditLogs } from './localAuditLogStore'
import type {
  AuditLogDto,
  AuditLogListResponse,
  AuditLogQuery,
  AuthEventType,
  ReportAuthEventInput,
} from './types'

export type {
  AuditLogCategory,
  AuditLogDto,
  AuditLogListResponse,
  AuditLogQuery,
  AuthEventType,
  CreateAuditLogPayload,
  ReportAuthEventInput,
} from './types'

const AUTH_TITLES: Record<AuthEventType, string> = {
  login: 'Login',
  logout: 'Logout',
  'login-failed': 'Login failed',
  'session-expired': 'Session expired',
  'password-changed': 'Password changed',
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function defaultDetail(eventType: AuthEventType, username: string, extra?: string) {
  const name = username.trim() || 'unknown'
  if (eventType === 'login') return `Người dùng ${name} đăng nhập thành công`
  if (eventType === 'logout') return `Người dùng ${name} đăng xuất`
  if (eventType === 'session-expired') {
    return `Phiên làm việc của ${name} hết hạn do không thao tác`
  }
  if (eventType === 'password-changed') return `Người dùng ${name} đổi mật khẩu`
  return extra?.trim()
    ? `Đăng nhập thất bại (${name}): ${extra.trim()}`
    : `Đăng nhập thất bại (${name})`
}

function buildAuthLog(input: ReportAuthEventInput): AuditLogDto {
  return {
    id: createId(),
    category: 'login',
    eventType: input.eventType,
    username: input.username.trim() || 'unknown',
    title: AUTH_TITLES[input.eventType],
    detail: defaultDetail(input.eventType, input.username, input.detail),
    occurredAt: new Date().toISOString(),
    endedAt: null,
    source: 'web',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    metadata: input.metadata,
  }
}

function localDay(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function matchesQuery(item: AuditLogDto, query: AuditLogQuery) {
  if (query.category && item.category !== query.category) return false
  if (query.eventType && item.eventType !== query.eventType) return false
  if (query.username && item.username.toLowerCase() !== query.username.toLowerCase()) {
    return false
  }
  const day = localDay(item.occurredAt)
  if (query.from && day < query.from) return false
  if (query.to && day > query.to) return false
  const keyword = query.keyword?.trim().toLowerCase()
  if (keyword) {
    const haystack = [item.title, item.detail, item.username, item.eventType]
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(keyword)) return false
  }
  return true
}

function sortByOccurredAtDesc(items: AuditLogDto[]) {
  return [...items].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )
}

/**
 * Ghi sự kiện đăng nhập lên backend. Nếu API chưa sẵn sàng, lưu cục bộ
 * để tab Lịch sử → Đăng nhập vẫn hiển thị được.
 */
export function reportAuthEvent(input: ReportAuthEventInput) {
  const entry = buildAuthLog(input)
  appendLocalAuditLog(entry)

  void apiCreateAuditLog(entry).catch(() => {
    // Backend chưa gắn — giữ bản cục bộ.
  })
}

export async function fetchAuditLogs(query: AuditLogQuery = {}): Promise<AuditLogListResponse> {
  const localItems = sortByOccurredAtDesc(
    listLocalAuditLogs().filter((item) => matchesQuery(item, query)),
  )

  try {
    const remote = await apiListAuditLogs(query)
    const byId = new Map<string, AuditLogDto>()
    remote.items.forEach((item) => byId.set(item.id, item))
    localItems.forEach((item) => {
      if (!byId.has(item.id)) byId.set(item.id, item)
    })
    const items = sortByOccurredAtDesc([...byId.values()])
    if (items.length === 0) {
      return { items: [], total: remote.total }
    }
    return { items, total: Math.max(remote.total, items.length) }
  } catch {
    return { items: localItems, total: localItems.length }
  }
}

export async function fetchLoginHistory(query: Omit<AuditLogQuery, 'category'> = {}) {
  return fetchAuditLogs({ ...query, category: 'login' })
}

export function logoutCurrentUser(reason: 'logout' | 'session-expired' = 'logout') {
  const username = getSessionUsername()
  if (username) {
    reportAuthEvent({ eventType: reason, username })
  } else if (reason === 'logout') {
    reportAuthEvent({ eventType: 'logout', username: 'unknown' })
  }
  endSession()
}
