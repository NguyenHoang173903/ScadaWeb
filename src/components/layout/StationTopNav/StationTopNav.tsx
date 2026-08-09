import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Clock3, LogOut, MapPin, UserRound, Users } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import styles from './StationTopNav.module.css'

type StationTopNavProps = {
  title: string
  address: string
  userName?: string
  userRole?: string
}

function formatDateTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function StationTopNav({
  title,
  address,
  userName = 'Admin',
  userRole = 'Quản trị viên',
}: StationTopNavProps) {
  const navigate = useNavigate()
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
      <div className={styles.left}>
        <h1>{title}</h1>
        <p className={styles.address}>
          <MapPin size={15} />
          <span>{address}</span>
        </p>
      </div>

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
