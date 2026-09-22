import { getIdleTimeoutMs } from './sessionPolicy'

const STORAGE_KEY = 'scadaweb.active-session'

export type SessionProfile = {
  username: string
  displayName?: string
  role?: string
}

type SessionState = SessionProfile & {
  lastActivityAt: number
}

type StoredSession = {
  state: SessionState
  persistent: boolean
}

function parseSession(raw: string | null): SessionState | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as SessionState
    if (!parsed?.lastActivityAt) return null
    return parsed
  } catch {
    return null
  }
}

function readStoredSession(): StoredSession | null {
  const session = parseSession(sessionStorage.getItem(STORAGE_KEY))
  if (session) return { state: session, persistent: false }

  const remembered = parseSession(localStorage.getItem(STORAGE_KEY))
  return remembered ? { state: remembered, persistent: true } : null
}

function readSession(): SessionState | null {
  return readStoredSession()?.state ?? null
}

function writeSession(state: SessionState, persistent: boolean) {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_KEY)
    const storage = persistent ? localStorage : sessionStorage
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore private mode / quota errors.
  }
}

export function beginSession(profile?: SessionProfile, remember?: boolean) {
  const stored = readStoredSession()
  const current = stored?.state
  writeSession({
    lastActivityAt: Date.now(),
    username: profile?.username ?? current?.username ?? '',
    displayName: profile?.displayName ?? current?.displayName,
    role: profile?.role ?? current?.role,
  }, remember ?? stored?.persistent ?? false)
}

export function touchSession() {
  const stored = readStoredSession()
  if (!stored) return
  writeSession(
    { ...stored.state, lastActivityAt: Date.now() },
    stored.persistent,
  )
}

export function endSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore
  }
}

export function hasActiveSession() {
  return readSession() != null
}

export function getSessionUsername() {
  const username = readSession()?.username?.trim()
  return username || null
}

export function getSessionProfile(): SessionProfile | null {
  const current = readSession()
  if (!current?.username?.trim()) return null
  return {
    username: current.username,
    displayName: current.displayName,
    role: current.role,
  }
}

function normalizeRole(role?: string | null) {
  return (role ?? '').trim().toLowerCase()
}

/** Admin / Administrator / SuperAdmin */
export function isAdminRole(role?: string | null) {
  const r = normalizeRole(role)
  return r === 'admin' || r === 'administrator' || r === 'superadmin'
}

/** Operator hoặc Admin — được export Excel theo BE */
export function canExportExcel(role?: string | null) {
  const r = normalizeRole(role)
  return isAdminRole(role) || r === 'operator'
}

export function getSessionRole() {
  return getSessionProfile()?.role
}

export function isSessionAdmin() {
  return isAdminRole(getSessionRole())
}

export function canSessionExportExcel() {
  return canExportExcel(getSessionRole())
}

export function isSessionExpired(now = Date.now()) {
  const current = readSession()
  if (!current) return false
  return now - current.lastActivityAt >= getIdleTimeoutMs()
}

export function getSessionRemainingMs(now = Date.now()) {
  const current = readSession()
  if (!current) return 0
  return Math.max(0, current.lastActivityAt + getIdleTimeoutMs() - now)
}
