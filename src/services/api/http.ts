import { getApiBaseUrl } from '@/settings/runtimeConfig'
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from '@/settings/authToken'
import type { ApiError, BackendApiResponse } from '@/types'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  /** Skip Authorization header (login/refresh). */
  anonymous?: boolean
  /** Skip ApiResponse unwrap — return raw JSON. */
  raw?: boolean
}

let refreshInFlight: Promise<boolean> | null = null

function resolveUrl(path: string) {
  const base = getApiBaseUrl().replace(/\/$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`

  // Base already ends with /api/v1 → path is /auth/login
  if (/\/api\/v1$/i.test(base)) return `${base}${normalized}`

  // Base ends with /api → insert /v1
  if (/\/api$/i.test(base)) {
    if (normalized.startsWith('/v1/')) return `${base}${normalized}`
    return `${base}/v1${normalized}`
  }

  // Bare host → /api/v1/...
  if (normalized.startsWith('/api/v1/')) return `${base}${normalized}`
  if (normalized.startsWith('/api/')) return `${base}${normalized.replace(/^\/api/, '/api/v1')}`
  return `${base}/api/v1${normalized}`
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const payload = (await response.json()) as BackendApiResponse<unknown> & {
      errorCode?: string
      message?: string
    }
    const message =
      payload.message ||
      (Array.isArray(payload.errors) ? payload.errors[0] : undefined) ||
      response.statusText
    return {
      message,
      status: response.status,
      details: payload,
      errors: payload.errors ?? undefined,
      errorCode: payload.errorCode,
    }
  } catch {
    return {
      message: response.statusText || 'Request failed',
      status: response.status,
    }
  }
}

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in (payload as object)) {
    const envelope = payload as BackendApiResponse<T>
    if (envelope.success === false) {
      const err: ApiError = {
        message: envelope.message || envelope.errors?.[0] || 'Request failed',
        errors: envelope.errors ?? undefined,
        details: envelope,
      }
      throw err
    }
    return envelope.data as T
  }
  return payload as T
}

async function tryRefreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(resolveUrl('/auth/refresh'), {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
        if (!response.ok) {
          clearAuthTokens()
          return false
        }
        const payload = unwrapData<{
          accessToken: string
          refreshToken: string
          sessionId: string
          accessTokenExpiresAt: string
        }>(await response.json())
        setAuthTokens({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          sessionId: payload.sessionId,
          accessTokenExpiresAt: payload.accessTokenExpiresAt,
        })
        return true
      } catch {
        clearAuthTokens()
        return false
      } finally {
        refreshInFlight = null
      }
    })()
  }

  return refreshInFlight
}

export async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, anonymous, raw, ...rest } = options
  const accessToken = anonymous ? null : getAccessToken()

  const response = await fetch(resolveUrl(path), {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401 && !anonymous && getRefreshToken()) {
    const refreshed = await tryRefreshAccessToken()
    if (refreshed) {
      return http<T>(path, { ...options, anonymous: false })
    }
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const payload = await response.json()
  if (raw) return payload as T
  return unwrapData<T>(payload)
}

/** Multipart upload — do not set Content-Type (browser sets boundary). */
export async function httpFormData<T>(
  path: string,
  options: Omit<RequestInit, 'body'> & { body: FormData; anonymous?: boolean; raw?: boolean },
): Promise<T> {
  const { body, headers, anonymous, raw, ...rest } = options
  const accessToken = anonymous ? null : getAccessToken()

  const response = await fetch(resolveUrl(path), {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body,
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const payload = await response.json()
  if (raw) return payload as T
  return unwrapData<T>(payload)
}

export function isApiError(value: unknown): value is ApiError {
  return Boolean(value && typeof value === 'object' && 'message' in value)
}

export function isNetworkError(error: unknown) {
  return error instanceof TypeError || (isApiError(error) && error.status == null)
}

/** Download binary (Excel export) — không unwrap `ApiResponse`. */
export async function downloadBinary(path: string, fallbackFilename: string): Promise<void> {
  const accessToken = getAccessToken()
  const response = await fetch(resolveUrl(path), {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  })

  if (response.status === 401 && getRefreshToken()) {
    const refreshed = await tryRefreshAccessToken()
    if (refreshed) {
      return downloadBinary(path, fallbackFilename)
    }
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(disposition)
  const filename = match ? decodeURIComponent(match[1].replace(/"/g, '')) : fallbackFilename

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
