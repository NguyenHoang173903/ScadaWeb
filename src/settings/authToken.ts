const STORAGE_KEY = 'scadaweb.auth-tokens'

export type AuthTokens = {
  accessToken: string
  refreshToken: string
  sessionId: string
  accessTokenExpiresAt: string
}

let tokens: AuthTokens | null = null
let persistent = false

function parseStored(raw: string | null): AuthTokens | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AuthTokens
    if (!parsed?.accessToken || !parsed?.refreshToken) return null
    return parsed
  } catch {
    return null
  }
}

function readStored(): AuthTokens | null {
  const sessionTokens = parseStored(sessionStorage.getItem(STORAGE_KEY))
  if (sessionTokens) return sessionTokens

  const rememberedTokens = parseStored(localStorage.getItem(STORAGE_KEY))
  if (rememberedTokens) {
    persistent = true
    return rememberedTokens
  }
  return null
}

function persist() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_KEY)
    if (!tokens) return

    const storage = persistent ? localStorage : sessionStorage
    storage.setItem(STORAGE_KEY, JSON.stringify(tokens))
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

export function setAuthTokens(next: AuthTokens, remember = persistent) {
  tokens = { ...next }
  persistent = remember
  persist()
}

export function clearAuthTokens() {
  tokens = null
  persistent = false
  persist()
}
