import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, MapPin, UserRound, Users } from 'lucide-react'
import logoTlhn from '@/assets/images/Logo_TLHN.svg'
import { ROUTES, stationDetailPath } from '@/constants/routes'
import { PUMP_STATIONS } from '@/data/pumpStations'
import styles from './DashboardPage.module.css'

const STATION_STATS = [
  { id: 'pump', label: `${PUMP_STATIONS.length} Trạm bơm`, interactive: true },
  { id: 'rain', label: '0 Trạm đo mưa', interactive: false },
  { id: 'level', label: '0 Trạm đo mực nước tự động', interactive: false },
] as const

const LEGEND_ITEMS = [
  { id: 'pump', label: 'Trạm bơm', color: '#f5c518' },
  { id: 'rain', label: 'Điểm đo mưa', color: '#2ec4b6' },
  { id: 'level', label: 'Điểm đo mực nước tự động', color: '#4caf50' },
] as const

export function DashboardPage() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pumpListOpen, setPumpListOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pumpRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (!menuRef.current?.contains(target)) {
        setMenuOpen(false)
      }
      if (!pumpRef.current?.contains(target)) {
        setPumpListOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.mapPlaceholder} aria-hidden="true" />

      <aside className={styles.summaryPanel}>
        <div className={styles.summaryHeader}>
          <h1>Hệ thống giám sát thủy lợi khu vực Hà Nội</h1>
          <img src={logoTlhn} alt="Logo thủy lợi Hà Nội" className={styles.logo} />
        </div>

        <div className={styles.statGrid}>
          {STATION_STATS.map((stat) => {
            if (stat.id === 'pump') {
              return (
                <div key={stat.id} className={styles.pumpStatWrap} ref={pumpRef}>
                  <button
                    type="button"
                    className={`${styles.statCard} ${styles.statButton} ${
                      pumpListOpen ? styles.statActive : ''
                    }`}
                    aria-expanded={pumpListOpen}
                    onClick={() => setPumpListOpen((open) => !open)}
                  >
                    {stat.label}
                  </button>

                  {pumpListOpen ? (
                    <div className={styles.stationDropdown}>
                      {PUMP_STATIONS.map((station) => (
                        <button
                          key={station.id}
                          type="button"
                          className={styles.stationItem}
                          onClick={() => {
                            setPumpListOpen(false)
                            navigate(stationDetailPath(station.id))
                          }}
                        >
                          {station.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            }

            return (
              <div key={stat.id} className={styles.statCard}>
                {stat.label}
              </div>
            )
          })}
        </div>
      </aside>

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
          <span>Administrator</span>
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

      <aside className={styles.legendPanel}>
        <h2>Chú thích</h2>
        <ul className={styles.legendList}>
          {LEGEND_ITEMS.map((item) => (
            <li key={item.id}>
              <MapPin size={18} fill={item.color} color={item.color} strokeWidth={1.5} />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
