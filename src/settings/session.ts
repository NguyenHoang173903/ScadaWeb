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

function readSession(): SessionState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SessionState
    if (!parsed?.lastActivityAt) return null
    return parsed
  } catch {
    return null
  }
}

function writeSession(state: SessionState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore private mode / quota errors.
  }
}

export function beginSession(profile?: SessionProfile) {
  const current = readSession()
  writeSession({
    lastActivityAt: Date.now(),
    username: profile?.username ?? current?.username ?? '',
    displayName: profile?.displayName ?? current?.displayName,
    role: profile?.role ?? current?.role,
  })
}

export function touchSession() {
  const current = readSession()
  if (!current) return
  writeSession({ ...current, lastActivityAt: Date.now() })
}

export function endSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
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
