import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import logoTlhn from '@/assets/images/Logo_TLHN.svg'
import { ROUTES } from '@/constants/routes'
import { STATION_NAV_ITEMS, type StationNavItem } from '@/constants/stationNav'
import styles from './StationSideNav.module.css'

function defaultChildPath(item: StationNavItem) {
  return item.children?.[0]?.path ?? item.path
}

function isGroupActive(pathname: string, item: StationNavItem) {
  return pathname.includes(`/${item.path}`)
}

export function StationSideNav() {
  const navigate = useNavigate()
  const { stationId = '' } = useParams()
  const location = useLocation()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev }
      for (const item of STATION_NAV_ITEMS) {
        if (item.children?.length && isGroupActive(location.pathname, item)) {
          next[item.id] = true
        }
      }
      return next
    })
  }, [location.pathname])

  return (
    <aside className={styles.sidebar}>
      <button
        type="button"
        className={styles.logoButton}
        onClick={() => navigate(ROUTES.dashboard)}
        aria-label="Về Dashboard"
      >
        <img src={logoTlhn} alt="Logo thủy lợi Hà Nội" className={styles.logo} />
      </button>

      <nav className={styles.nav} aria-label="Menu trạm bơm">
        {STATION_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const to = `/stations/${stationId}/${item.path}`
          const hasChildren = Boolean(item.children?.length)

          if (hasChildren) {
            const parentActive = isGroupActive(location.pathname, item)
            const isOpen = Boolean(openGroups[item.id])
            const firstChildTo = `/stations/${stationId}/${defaultChildPath(item)}`

            return (
              <div key={item.id} className={styles.navGroup}>
                <button
                  type="button"
                  className={`${styles.navItem} ${styles.navParent} ${parentActive ? styles.active : ''}`}
                  title={item.label}
                  onClick={() => {
                    setOpenGroups((prev) => {
                      const nextOpen = !prev[item.id]
                      if (nextOpen && !parentActive) {
                        navigate(firstChildTo)
                      }
                      return { ...prev, [item.id]: nextOpen }
                    })
                  }}
                >
                  <Icon size={18} />
                  <span className={styles.navLabel}>{item.label}</span>
                  <ChevronDown
                    size={16}
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                  />
                </button>

                {isOpen ? (
                  <div className={styles.subNav}>
                    {item.children!.map((child) => (
                      <NavLink
                        key={child.id}
                        to={`/stations/${stationId}/${child.path}`}
                        className={({ isActive }) =>
                          `${styles.subNavItem} ${isActive ? styles.subActive : ''}`
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          }

          return (
            <NavLink
              key={item.id}
              to={to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              title={item.label}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
