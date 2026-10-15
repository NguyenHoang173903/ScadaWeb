import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import loginBackground from '@/assets/images/Background_Login.png'
import logoTlhn from '@/assets/images/Logo_TLHN.svg'
import { ROUTES } from '@/constants/routes'
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

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <img
            src={logoTlhn}
            alt="Biểu trưng Công ty Thủy lợi Hà Nội"
            className={styles.headerLogo}
          />
          <div className={styles.headerCopy}>
            <p>ỦY BAN NHÂN DÂN THÀNH PHỐ HÀ NỘI</p>
            <p>CÔNG TY TNHH MTV ĐẦU TƯ PHÁT TRIỂN THỦY LỢI HÀ NỘI</p>
            <h1>
              PHẦN MỀM TRUY CẬP GIAO DIỆN SCADA THÔNG QUA TRÌNH DUYỆT WEB - WEB
              BROWSER
            </h1>
          </div>
        </header>

        <div className={styles.workspace}>
          <main className={styles.authPane}>
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
                  const message = isApiError(error)
                    ? error.message
                    : 'Không đặt lại được mật khẩu.'
                  setLoginError(message)
                  throw new Error(message)
                } finally {
                  setBusy(false)
                }
              }}
            />
          ) : challenge ? (
            <ChangePasswordForm
              username={challenge.username}
              message={PASSWORD_CHALLENGE_COPY[challenge.reason]}
              currentPassword={challenge.currentPassword}
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
                  const message = isApiError(error)
                    ? error.message
                    : 'Không đổi được mật khẩu. Thử lại.'
                  setLoginError(message)
                  throw new Error(message)
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
          </main>

          <div className={styles.imagePane}>
            <img
              src={loginBackground}
              alt="Công trình thủy lợi Hà Nội"
              className={styles.loginImage}
            />
          </div>
        </div>

        <footer className={styles.footer}>
          <span>PHẦN MỀM WEB SCADA</span>
          <span>THỦY LỢI HÀ NỘI</span>
        </footer>
      </div>
    </div>
  )
}
