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
import { APP_COPYRIGHT, APP_SUPPORT_EMAIL, APP_VERSION } from '@/constants/config'
import { ROUTES } from '@/constants/routes'
import { getLoginLayerVisible } from '@/settings/loginLayerSettings'
import { peekCachedMapLayers, resolveMapLayers } from '@/services/mapLayers'
import { reportAuthEvent } from '@/services/auditLog'
import { LoginForm } from './LoginForm'
import { ChangePasswordForm } from './ChangePasswordForm'
import {
  authenticateAccount,
  completePasswordChange,
  getLoginAttemptStatus,
  unlockFailedLoginLock,
  PASSWORD_CHALLENGE_COPY,
  type PasswordChallengeReason,
} from '@/settings/authAccounts'
import { beginSession } from '@/settings/session'
import styles from './LoginPage.module.css'

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

export function LoginPage() {
  const navigate = useNavigate()
  const [layers, setLayers] = useState<MapOverlayLayer[]>(() =>
    getLoginLayerVisible() ? peekCachedMapLayers() : [],
  )
  const [loginError, setLoginError] = useState('')
  const [loginWarning, setLoginWarning] = useState('')
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null)
  const [challenge, setChallenge] = useState<{
    username: string
    reason: PasswordChallengeReason
  } | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      if (!getLoginLayerVisible()) {
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
      // Do not revoke KMZ media here — owned by mapLayers memory cache.
    }
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.workspace}>
          <div className={styles.mapPane}>
            <DashboardMap layers={layers} zoomLocked />
          </div>

          {challenge ? (
            <ChangePasswordForm
              username={challenge.username}
              message={PASSWORD_CHALLENGE_COPY[challenge.reason]}
              onCancel={() => {
                setChallenge(null)
                setLoginError('')
                setLoginWarning('')
              }}
              onSubmit={(password) => {
                const account = completePasswordChange(challenge.username, password)
                const username = account?.username ?? challenge.username
                reportAuthEvent({
                  eventType: 'password-changed',
                  username,
                })
                reportAuthEvent({ eventType: 'login', username })
                beginSession({
                  username,
                  displayName: account?.fullName,
                  role: account?.role,
                })
                navigate(ROUTES.dashboard)
              }}
            />
          ) : (
            <LoginForm
              error={loginError}
              warning={loginWarning}
              blockedUntil={blockedUntil}
              onUsernameChange={(username) => {
                const status = getLoginAttemptStatus(username)
                setLoginError(status.message)
                setLoginWarning(status.warning)
                setBlockedUntil(status.blockedUntil)
              }}
              onForgotPassword={(username) => {
                const result = unlockFailedLoginLock(username)
                if (!result.ok) {
                  setLoginError(result.message)
                  setLoginWarning('')
                  return
                }
                setLoginError('')
                setLoginWarning(result.warning)
                setBlockedUntil(null)
              }}
              onSubmit={({ username, password }) => {
                const result = authenticateAccount(username, password)
                if (!result.ok) {
                  reportAuthEvent({
                    eventType: 'login-failed',
                    username,
                    detail: result.message,
                  })
                  setLoginError(result.message)
                  setLoginWarning(result.warning ?? '')
                  setBlockedUntil(result.blockedUntil ?? null)
                  return
                }
                setLoginError('')
                setLoginWarning('')
                setBlockedUntil(null)
                if (result.challenge && result.account) {
                  setChallenge({ username: result.account.username, reason: result.challenge })
                  return
                }
                const account = result.account
                const sessionUser = account?.username ?? username
                reportAuthEvent({ eventType: 'login', username: sessionUser })
                beginSession({
                  username: sessionUser,
                  displayName: account?.fullName,
                  role: account?.role,
                })
                navigate(ROUTES.dashboard)
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
