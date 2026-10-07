import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { logoutCurrentUser } from '@/services/auditLog'
import { fetchSessionPolicy } from '@/services/sessionPolicy/sessionPolicyApi'
import { getRefreshToken } from '@/settings/authToken'
import {
  hasActiveSession,
  isSessionExpired,
  touchSession,
} from '@/settings/session'
import { setSessionPolicy, subscribeSessionPolicy } from '@/settings/sessionPolicy'
import { SessionExpiredDialog } from './SessionExpiredDialog'

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'] as const

export function SessionGuard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (location.pathname === ROUTES.login) return
    // Unauthenticated: the render below already redirects to login.
    if (!hasActiveSession() || !getRefreshToken()) return
    touchSession()
    void fetchSessionPolicy()
      .then((policy) => setSessionPolicy({ idleTimeoutMinutes: policy.idleTimeoutMinutes }))
      .catch(() => {
        // Keep the safe in-memory default when BE is unavailable.
      })
  }, [location.pathname, navigate])

  useEffect(() => {
    // 401 / failed refresh (http.ts cleared tokens): back to login.
    const handleUnauthorized = () => {
      setExpired(false)
      navigate(ROUTES.login, { replace: true })
    }
    window.addEventListener('scadaweb:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('scadaweb:unauthorized', handleUnauthorized)
  }, [navigate])

  useEffect(() => {
    if (location.pathname === ROUTES.login || expired) return

    let lastTouch = 0
    const onActivity = () => {
      const now = Date.now()
      if (now - lastTouch < 1000) return
      lastTouch = now
      touchSession()
    }

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, onActivity, { passive: true })
    })

    const check = () => {
      if (isSessionExpired()) {
        logoutCurrentUser('session-expired')
        setExpired(true)
      }
    }

    const timer = window.setInterval(check, 1000)
    const unsubscribe = subscribeSessionPolicy(() => check())
    check()

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, onActivity)
      })
      window.clearInterval(timer)
      unsubscribe()
    }
  }, [location.pathname, expired])

  if (location.pathname === ROUTES.login) {
    return <Outlet />
  }

  // Deep link without a session: redirect before any protected page renders or fetches.
  if (!hasActiveSession() || !getRefreshToken()) {
    return <Navigate to={ROUTES.login} replace />
  }

  return (
    <>
      <Outlet />
      {expired ? (
        <SessionExpiredDialog
          onLogin={() => {
            setExpired(false)
            navigate(ROUTES.login, { replace: true })
          }}
        />
      ) : null}
    </>
  )
}
