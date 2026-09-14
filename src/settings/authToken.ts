const STORAGE_KEY = 'scadaweb.auth-tokens'

export type AuthTokens = {
  accessToken: string
  refreshToken: string
  sessionId: string
  accessTokenExpiresAt: string
}

let tokens: AuthTokens | null = null

function readStored(): AuthTokens | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthTokens
    if (!parsed?.accessToken || !parsed?.refreshToken) return null
    return parsed
  } catch {
    return null
  }
}

function persist() {
  try {
    if (!tokens) sessionStorage.removeItem(STORAGE_KEY)
    else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
  } catch {
    // Ignore private mode / quota.
  }
}

tokens = readStored()

export function getAccessToken() {
  return tokens?.accessToken ?? null
}

export function getRefreshToken() {
  return tokens?.refreshToken ?? null
}

export function getSessionId() {
  return tokens?.sessionId ?? null
}

export function getAuthTokens() {
  return tokens ? { ...tokens } : null
}

export function setAuthTokens(next: AuthTokens) {
  tokens = { ...next }
  persist()
}

export function clearAuthTokens() {
  tokens = null
  persist()
}
