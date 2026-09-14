export type SessionPolicy = {
  /** 2.1a — idle timeout (minutes) before the session is closed. */
  idleTimeoutMinutes: number
}

export const DEFAULT_SESSION_POLICY: SessionPolicy = {
  /** Tạm 3 phút; admin sẽ cấu hình sau qua giao diện. */
  idleTimeoutMinutes: 3,
}

const STORAGE_KEY = 'scadaweb.session-policy.v2'

let policy: SessionPolicy = { ...DEFAULT_SESSION_POLICY }

function clampPolicy(value: Partial<SessionPolicy>): SessionPolicy {
  return {
    idleTimeoutMinutes: Math.max(1, Math.floor(value.idleTimeoutMinutes ?? policy.idleTimeoutMinutes)),
  }
}

function readStored(): SessionPolicy {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SESSION_POLICY }
    return clampPolicy(JSON.parse(raw) as Partial<SessionPolicy>)
  } catch {
    return { ...DEFAULT_SESSION_POLICY }
  }
}

policy = readStored()

type Listener = (next: SessionPolicy) => void
const listeners = new Set<Listener>()

export function getSessionPolicy() {
  return { ...policy }
}

export function setSessionPolicy(next: Partial<SessionPolicy>) {
  policy = clampPolicy({ ...policy, ...next })
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(policy))
  } catch {
    // Ignore private mode / quota errors.
  }
  listeners.forEach((listener) => listener({ ...policy }))
}

export function subscribeSessionPolicy(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getIdleTimeoutMs() {
  return getSessionPolicy().idleTimeoutMinutes * 60 * 1000
}
