import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Clock3, KeyRound, LogOut, UserRound, Users } from 'lucide-react'
import logoTlhn from '@/assets/images/Logo_TLHN.svg'
import { APP_COMPANY } from '@/constants/config'
import { ROUTES } from '@/constants/routes'
import { logoutCurrentUser } from '@/services/auditLog'
import {
  getRoleDisplayName,
  getSessionRole,
  getSessionUsername,
  isSessionAdmin,
} from '@/settings/session'
import styles from './AdminHeader.module.css'

type AdminHeaderProps = {
  userName?: string
  userRole?: string
}

function formatDateTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function AdminHeader({
  userName,
  userRole,
}: AdminHeaderProps) {
  const navigate = useNavigate()
  const resolvedName = userName ?? getSessionUsername() ?? 'Admin'
  const resolvedRole = userRole ?? getRoleDisplayName(getSessionRole())
  const canManageUsers = isSessionAdmin()
  const [now, setNow] = useState(() => formatDateTime(new Date()))
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(formatDateTime(new Date()))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.logoButton}
        onClick={() => navigate(ROUTES.dashboard)}
        aria-label="Về Dashboard"
      >
        <img src={logoTlhn} alt="Logo thủy lợi Hà Nội" className={styles.logo} />
        <span className={styles.brandText}>
          <strong>HỆ THỐNG CƠ SỞ DỮ LIỆU SỐ</strong>
          <small>{APP_COMPANY}</small>
        </span>
      </button>

      <div className={styles.right}>
        <div className={styles.clock}>
          <Clock3 size={16} />
          <span>{now}</span>
        </div>

        <div className={styles.userMenu} ref={menuRef}>
          <button
            type="button"
            className={styles.userButton}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={styles.avatar}>
              <UserRound size={16} />
            </span>
            <span className={styles.userMeta}>
              <strong>{resolvedName}</strong>
              <small>{resolvedRole}</small>
            </span>
            <ChevronDown size={16} className={menuOpen ? styles.chevronOpen : undefined} />
          </button>

          {menuOpen ? (
            <div className={styles.dropdown}>
              {canManageUsers ? (
                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => {
                    setMenuOpen(false)
                    navigate(ROUTES.users)
                  }}
                >
                  <Users size={16} />
                  Quản lý người dùng
                </button>
              ) : null}
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={() => {
                  setMenuOpen(false)
                  navigate(ROUTES.changePassword)
                }}
              >
                <KeyRound size={16} />
                Đổi mật khẩu
              </button>
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={() => {
                  setMenuOpen(false)
                  logoutCurrentUser('logout')
                  navigate(ROUTES.login)
                }}
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
