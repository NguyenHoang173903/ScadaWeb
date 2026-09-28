import { useEffect, useState, type ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, type LucideProps } from 'lucide-react'
import locationOnMapIcon from '@/assets/icons/location_on_map.svg'
import gaugeIcon from '@/assets/icons/gauge.svg'
import rainyIcon from '@/assets/icons/rainy.svg'
import pumpIcon from '@/assets/icons/Pump.svg'
import reportIcon from '@/assets/icons/report_1.svg'
import { DashboardMap } from '@/components/map'
import type { MapOverlayLayer } from '@/components/map/layerTypes'
import {
  APP_COPYRIGHT,
  APP_SUPPORT_EMAIL,
  APP_VERSION,
  MAP_ENABLED,
} from '@/constants/config'
import { ROUTES } from '@/constants/routes'
import {
  getLoginLayerVisible,
  subscribeLoginLayerVisible,
} from '@/settings/loginLayerSettings'
import { peekCachedMapLayers, resolveMapLayers } from '@/services/mapLayers'
import { reportAuthEvent } from '@/services/auditLog'
import {
  changePasswordWithApi,
  forgotPasswordWithApi,
  loginWithApi,
  resetPasswordWithApi,
  type AuthTokenResponse,
} from '@/services/auth/authApi'
import { isApiError } from '@/services/api/http'
import { LoginForm } from './LoginForm'
import { ChangePasswordForm } from './ChangePasswordForm'
import { clearAuthTokens, getRefreshToken } from '@/settings/authToken'
import {
  beginSession,
  endSession,
  hasActiveSession,
  isSessionExpired,
} from '@/settings/session'
import { fetchSessionPolicy } from '@/services/sessionPolicy/sessionPolicyApi'
import { setSessionPolicy } from '@/settings/sessionPolicy'
import styles from './LoginPage.module.css'

type PasswordChallengeReason = 'default' | 'interval' | 'expired'

const PASSWORD_CHALLENGE_COPY: Record<PasswordChallengeReason, string> = {
  default: 'Đây là lần đăng nhập đầu tiên với mật khẩu mặc định. Vui lòng đặt mật khẩu mới.',
  interval: 'Đã đến kỳ đổi mật khẩu định kỳ. Vui lòng đặt mật khẩu mới để tiếp tục.',
  expired:
    'Tài khoản đã bị khóa vì mật khẩu hết hạn hiệu lực. Đặt mật khẩu mới để tự động mở khóa.',
}

type ServiceItem = {
  id: string
  lines: readonly string[]
  iconSrc?: string
  Icon?: ComponentType<LucideProps>
  flipHorizontal?: boolean
}

const SERVICE_ITEMS: ServiceItem[] = [
  { id: 'gis', lines: ['BẢN ĐỒ', 'GIS'], iconSrc: locationOnMapIcon },
  { id: 'level', lines: ['QUAN TRẮC', 'MỰC NƯỚC'], iconSrc: gaugeIcon },
  { id: 'rain', lines: ['QUAN TRẮC', 'LƯỢNG MƯA'], iconSrc: rainyIcon, flipHorizontal: true },
  { id: 'pump', lines: ['QUẢN LÝ HỆ', 'THỐNG THUỶ LỢI'], iconSrc: pumpIcon },
  { id: 'report', lines: ['BÁO CÁO', 'THỐNG KÊ'], iconSrc: reportIcon },
  { id: 'alert', lines: ['CẢNH BÁO', 'SỰ KIỆN'], Icon: Bell },
]

function challengeFromAuth(data: AuthTokenResponse): PasswordChallengeReason | null {
  if (data.mustChangePassword) return 'default'
  if (data.passwordExpiringSoon) return 'interval'
  return null
}

function enterApp(
  data: Pick<AuthTokenResponse, 'username' | 'fullName' | 'displayName' | 'role'>,
  remember: boolean,
) {
  beginSession({
    username: data.username,
    displayName: data.fullName || data.displayName,
    role: data.role,
  }, remember)
  void fetchSessionPolicy()
    .then((policy) => setSessionPolicy({ idleTimeoutMinutes: policy.idleTimeoutMinutes }))
    .catch(() => {
      // Keep local session policy if BE unreachable.
    })
}

export function LoginPage() {
  const navigate = useNavigate()
  const [layers, setLayers] = useState<MapOverlayLayer[]>(() =>
    getLoginLayerVisible() ? peekCachedMapLayers() : [],
  )
  const [loginLayerVisible, setLoginLayerVisibleState] = useState(getLoginLayerVisible)
  const [loginError, setLoginError] = useState('')
  const [loginWarning, setLoginWarning] = useState('')
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [challenge, setChallenge] = useState<{
    username: string
    reason: PasswordChallengeReason
    currentPassword: string
    remember: boolean
  } | null>(null)
  const [resetToken, setResetToken] = useState<{
    username: string
    token: string
  } | null>(null)

  useEffect(() => {
    if (
      getRefreshToken() &&
      hasActiveSession() &&
      !isSessionExpired()
    ) {
      navigate(ROUTES.dashboard, { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    return subscribeLoginLayerVisible(setLoginLayerVisibleState)
  }, [])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      if (!MAP_ENABLED || !loginLayerVisible) {
        setLayers([])
        return
      }

      try {
        const loaded = await resolveMapLayers()
        if (cancelled) return
        setLayers(loaded)
      } catch {
        // Login page still works without the map layer.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [loginLayerVisible])

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.workspace}>
          <div className={styles.mapPane}>
            {MAP_ENABLED ? <DashboardMap layers={layers} zoomLocked /> : null}
          </div>

          {resetToken ? (
            <ChangePasswordForm
              username={resetToken.username}
              message="Nhập mật khẩu mới để hoàn tất đặt lại (dev token từ forgot-password)."
              onCancel={() => {
                setResetToken(null)
                setLoginError('')
                setLoginWarning('')
              }}
              onSubmit={async (password) => {
                setBusy(true)
                try {
                  await resetPasswordWithApi(resetToken.token, password)
                  setResetToken(null)
                  setLoginWarning('Đã đặt lại mật khẩu. Đăng nhập bằng mật khẩu mới.')
                  setLoginError('')
                } catch (error) {
                  setLoginError(
                    isApiError(error) ? error.message : 'Không đặt lại được mật khẩu.',
                  )
                } finally {
                  setBusy(false)
                }
              }}
            />
          ) : challenge ? (
            <ChangePasswordForm
              username={challenge.username}
              message={PASSWORD_CHALLENGE_COPY[challenge.reason]}
              onCancel={() => {
                setChallenge(null)
                setLoginError('')
                setLoginWarning('')
              }}
              onSubmit={async (password) => {
                setBusy(true)
                try {
                  await changePasswordWithApi(challenge.currentPassword, password)
                  reportAuthEvent({
                    eventType: 'password-changed',
                    username: challenge.username,
                  })
                  clearAuthTokens()
                  endSession()
                  setChallenge(null)
                  setLoginError('')
                  setLoginWarning('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.')
                } catch (error) {
                  setLoginError(
                    isApiError(error) ? error.message : 'Không đổi được mật khẩu. Thử lại.',
                  )
                } finally {
                  setBusy(false)
                }
              }}
            />
          ) : (
            <LoginForm
              error={loginError}
              warning={loginWarning}
              blockedUntil={blockedUntil}
              onUsernameChange={() => {
                setLoginError('')
                setLoginWarning('')
                setBlockedUntil(null)
              }}
              onForgotPassword={(username) => {
                void (async () => {
                  if (!username.trim()) {
                    setLoginError('Nhập tên đăng nhập rồi chọn Quên mật khẩu?')
                    return
                  }
                  try {
                    const result = await forgotPasswordWithApi(username.trim())
                    setLoginError('')
                    if (result.developmentResetToken) {
                      setResetToken({
                        username: username.trim(),
                        token: result.developmentResetToken,
                      })
                      setLoginWarning(result.message || 'Nhập mật khẩu mới để đặt lại.')
                    } else {
                      setLoginWarning(
                        result.message || 'Nếu tài khoản tồn tại, hướng dẫn đã được gửi.',
                      )
                    }
                    setBlockedUntil(null)
                  } catch (error) {
                    setLoginError(
                      isApiError(error)
                        ? error.message
                        : 'Không gửi được yêu cầu quên mật khẩu.',
                    )
                  }
                })()
              }}
              onSubmit={({ username, password, remember }) => {
                void (async () => {
                  if (busy) return
                  setBusy(true)
                  setLoginError('')
                  setLoginWarning('')

                  const apiResult = await loginWithApi(username, password, remember)

                  if (apiResult.ok) {
                    const reason = challengeFromAuth(apiResult.data)
                    if (reason) {
                      setChallenge({
                        username: apiResult.data.username,
                        reason,
                        currentPassword: password,
                        remember,
                      })
                      setBusy(false)
                      return
                    }
                    reportAuthEvent({ eventType: 'login', username: apiResult.data.username })
                    enterApp(apiResult.data, remember)
                    navigate(ROUTES.dashboard)
                    setBusy(false)
                    return
                  }

                  reportAuthEvent({
                    eventType: 'login-failed',
                    username,
                    detail: apiResult.message,
                  })
                  setLoginError(apiResult.message)
                  setBlockedUntil(apiResult.blockedUntil ?? null)
                  setBusy(false)
                })()
              }}
            />
          )}
        </div>

        <nav className={styles.services} aria-label="Dịch vụ hệ thống">
          {SERVICE_ITEMS.map(({ id, lines, iconSrc, Icon, flipHorizontal }) => (
            <button key={id} type="button" className={styles.serviceItem}>
              <span className={styles.serviceIcon}>
                {iconSrc ? (
                  <img
                    src={iconSrc}
                    alt=""
                    className={`${styles.serviceGlyph}${flipHorizontal ? ` ${styles.serviceGlyphFlipX}` : ''}`}
                  />
                ) : Icon ? (
                  <Icon size={30} strokeWidth={1.8} />
                ) : null}
              </span>
              <span className={styles.serviceLabel}>
                {lines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <footer className={styles.footer}>
        <span className={styles.footerVersion}>Version V{APP_VERSION}</span>
        <div className={styles.footerRight}>
          <span>{APP_COPYRIGHT}</span>
          <a href={`mailto:${APP_SUPPORT_EMAIL}`}>{APP_SUPPORT_EMAIL}</a>
        </div>
      </footer>
    </div>
  )
}
