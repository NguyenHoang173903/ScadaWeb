import type { AuditLogDto } from './types'

const STORAGE_KEY = 'scadaweb.audit-logs'
const MAX_ITEMS = 500

function readAll(): AuditLogDto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AuditLogDto[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(items: AuditLogDto[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)))
  } catch {
    // Ignore private mode / quota errors.
  }
}

export function appendLocalAuditLog(entry: AuditLogDto) {
  const next = [entry, ...readAll().filter((item) => item.id !== entry.id)]
  writeAll(next)
}

export function listLocalAuditLogs(): AuditLogDto[] {
  return readAll()
}
