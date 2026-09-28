import { endSession, getSessionUsername } from '@/settings/session'
import { logoutWithApi } from '@/services/auth/authApi'
import { apiListAuditLogs } from './auditLogApi'
import type {
  AuditLogListResponse,
  AuditLogQuery,
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

/**
 * Backend auth service owns authentication audit writes.
 * Retained for call-site compatibility.
 */
export function reportAuthEvent(input: ReportAuthEventInput) {
  // Authentication audit is written by the backend auth service.
  // Keep this client hook for call-site compatibility only.
  void input
}

export async function fetchAuditLogs(query: AuditLogQuery = {}): Promise<AuditLogListResponse> {
  return apiListAuditLogs(query)
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
  void logoutWithApi()
  endSession()
}
