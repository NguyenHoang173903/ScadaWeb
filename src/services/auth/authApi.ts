import { http } from '@/services/api/http'
import { isApiError } from '@/services/api/http'
import {
  clearAuthTokens,
  getRefreshToken,
  getSessionId,
  setAuthTokens,
} from '@/settings/authToken'

export type AuthTokenResponse = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
  sessionId: string
  userId: number
  username: string
  fullName: string
  displayName: string
  role: string
  mustChangePassword: boolean
  passwordExpiresInDays?: number | null
  passwordExpiringSoon: boolean
  email?: string | null
  unit?: string | null
  level?: number | null
  department?: string | null
  position?: string | null
  description?: string | null
}

export type CurrentUserResponse = {
  id: number
  username: string
  fullName: string
  displayName: string
  role: string
  isActive: boolean
  mustChangePassword: boolean
  passwordExpiresInDays?: number | null
  passwordExpiringSoon: boolean
  email?: string | null
  unit?: string | null
  level?: number | null
  department?: string | null
  position?: string | null
  description?: string | null
}

export type LoginResult =
  | { ok: true; data: AuthTokenResponse }
  | {
      ok: false
      message: string
      status?: number
      blockedUntil?: number | null
    }

function persistTokens(data: AuthTokenResponse) {
  setAuthTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    sessionId: data.sessionId,
    accessTokenExpiresAt: data.accessTokenExpiresAt,
  })
}

export async function loginWithApi(username: string, password: string): Promise<LoginResult> {
  try {
    const data = await http<AuthTokenResponse>('/auth/login', {
      method: 'POST',
      body: { username, password },
      anonymous: true,
    })
    persistTokens(data)
    return { ok: true, data }
  } catch (error) {
    if (!isApiError(error)) {
      return { ok: false, message: 'Không kết nối được máy chủ. Kiểm tra URL API.' }
    }

    return {
      ok: false,
      message: error.message || 'Đăng nhập thất bại.',
      status: error.status,
      blockedUntil: error.status === 423 ? Date.now() + 15 * 60 * 1000 : null,
    }
  }
}

export async function changePasswordWithApi(currentPassword: string, newPassword: string) {
  await http('/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  })
}

export async function logoutWithApi() {
  const refreshToken = getRefreshToken()
  const sessionId = getSessionId()
  try {
    if (refreshToken) {
      await http('/auth/logout', {
        method: 'POST',
        body: { refreshToken, sessionId },
        anonymous: true,
      })
    }
  } catch {
    // Always clear local tokens.
  } finally {
    clearAuthTokens()
  }
}

export async function fetchCurrentUser() {
  return http<CurrentUserResponse>('/auth/me', { method: 'GET' })
}

export async function forgotPasswordWithApi(username: string) {
  return http<{ message: string; developmentResetToken?: string | null }>('/auth/forgot-password', {
    method: 'POST',
    body: { username },
    anonymous: true,
  })
}
