import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Clock3, LogOut, UserRound, Users } from 'lucide-react'
import logoTlhn from '@/assets/images/Logo_TLHN.svg'
import { ROUTES } from '@/constants/routes'
import styles from './AdminHeader.module.css'

type AdminHeaderProps = {
  userName?: string
  userRole?: string
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('vi-VN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function AdminHeader({
  userName = 'Admin',
  userRole = 'Quản trị viên',
}: AdminHeaderProps) {
  const navigate = useNavigate()
  const [now, setNow] = useState(() => formatTime(new Date()))
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(formatTime(new Date()))
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
              <strong>{userName}</strong>
              <small>{userRole}</small>
            </span>
            <ChevronDown size={16} className={menuOpen ? styles.chevronOpen : undefined} />
          </button>

          {menuOpen ? (
            <div className={styles.dropdown}>
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
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={() => {
                  setMenuOpen(false)
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
