import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Layers, UserRound } from 'lucide-react'
import logoTlhn from '@/assets/images/Logo_TLHN.svg'
import { DashboardMap, FeatureInfoPanel, LayerPanel, StationListPanel } from '@/components/map'
import {
  buildMapStations,
  type MapStation,
  type MapStationType,
} from '@/components/map/extractStations'
import type { MapOverlayLayer } from '@/components/map/layerTypes'
import { ROUTES, stationDataUpdatePath, stationDetailPath } from '@/constants/routes'
import { APP_COMPANY, MAP_ENABLED } from '@/constants/config'
import { registerPumpStation, resolvePumpStationRouteId } from '@/data/pumpStations'
import { logoutCurrentUser } from '@/services/auditLog'
import { getStation, listStations as fetchStationsApi } from '@/services/stations/stationsApi'
import { getSessionUsername, isSessionAdmin } from '@/settings/session'
import {
  deleteMapLayer,
  getMapLayerStorageMode,
  peekCachedMapLayers,
  resolveMapLayers,
  subscribeMapLayers,
  updateMapLayerMeta,
  uploadMapLayer,
} from '@/services/mapLayers'
import styles from './DashboardPage.module.css'

const LEGEND_ITEMS = [
  { id: 'pump', label: 'Trạm bơm', color: '#0CFF0C' },
  { id: 'rain', label: 'Điểm đo mưa', color: '#F4B400' },
  { id: 'level', label: 'Điểm đo mực nước tự động', color: '#2D7DD2' },
] as const

function formatNow(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function DashboardPage() {
  const navigate = useNavigate()
  const userName = getSessionUsername() ?? 'Admin'
  const canUpdateStation = isSessionAdmin()
  const [menuOpen, setMenuOpen] = useState(false)
  const [listType, setListType] = useState<MapStationType>('pump')
  const [layersOpen, setLayersOpen] = useState(false)
  const [layers, setLayers] = useState<MapOverlayLayer[]>(() => peekCachedMapLayers())
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    () => peekCachedMapLayers()[0]?.id ?? null,
  )
  const [selectedStation, setSelectedStation] = useState<MapStation | null>(null)
  const [now, setNow] = useState(() => formatNow(new Date()))
  const [stationCatalogVersion, setStationCatalogVersion] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(formatNow(new Date()))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const result = await fetchStationsApi({ isActive: true })
        if (cancelled) return
        for (const item of result.items ?? []) {
          registerPumpStation({
            id: String(item.id),
            name: item.name,
            code: item.code,
            address: '—',
            status: item.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động',
            pumps: 0,
            capacity: '—',
            lat: 0,
            lng: 0,
          })
          void getStation(item.id)
            .then((detail) => {
              if (cancelled) return
              registerPumpStation({
                id: String(detail.id),
                name: detail.name,
                code: detail.code,
                address: detail.address?.trim() || '—',
                status: detail.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động',
                pumps: 0,
                capacity: '—',
                lat: detail.latitude ?? 0,
                lng: detail.longitude ?? 0,
              })
              setStationCatalogVersion((v) => v + 1)
            })
            .catch(() => {
              // Keep list row without coords.
            })
        }
        setStationCatalogVersion((v) => v + 1)
      } catch {
        // Keep mock PUMP_STATIONS.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const loaded = await resolveMapLayers()
        if (cancelled) return
        setLayers(loaded)
        setSelectedLayerId(loaded[0]?.id ?? null)
      } catch {
        // Map still works without an uploaded layer.
      }
    })()

    const unsubscribe = subscribeMapLayers(() => {
      const cached = peekCachedMapLayers()
      setLayers(cached)
      setSelectedStation((current) => {
        if (!current) return current
        const overlay = cached.find((layer) => current.id.startsWith(`overlay-${layer.id}-`))
        if (overlay) {
          return {
            ...current,
            mediaBaseUrl: overlay.mediaBaseUrl,
            mediaUrls: overlay.mediaUrls,
          }
        }
        const match = buildMapStations(cached).find((station) => station.id === current.id)
        return match ?? current
      })
    })

    return () => {
      cancelled = true
      unsubscribe()
      // Do not revoke KMZ media here — owned by mapLayers memory cache.
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (!menuRef.current?.contains(target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const openStationList = (type: MapStationType) => {
    setListType(type)
    setSelectedStation(null)
    setLayersOpen(false)
  }

  const handleUpload = async (file: File) => {
    if (getMapLayerStorageMode() === 'api' && !isSessionAdmin()) {
      window.alert('Chỉ Admin được upload lớp bản đồ lên server.')
      return
    }
    try {
      const next = await uploadMapLayer(file)
      setLayers((prev) => [...prev, next])
      setSelectedLayerId(next.id)
      setSelectedStation(null)
      setLayersOpen(true)
    } catch {
      window.alert('Không đọc được file KML/KMZ. Vui lòng thử lại.')
    }
  }

  const updateLayer = (
    id: string,
    patch: Partial<Pick<MapOverlayLayer, 'opacity' | 'weight' | 'visible'>>,
  ) => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== id) return layer
        const next = { ...layer, ...patch }
        void updateMapLayerMeta(id, {
          opacity: next.opacity,
          weight: next.weight,
          visible: next.visible,
          name: next.name,
          color: next.color,
        })
        return next
      }),
    )
  }

  const removeLayer = (id: string) => {
    setSelectedStation(null)
    const next = layers.filter((layer) => layer.id !== id)
    setLayers(next)
    setSelectedLayerId((current) =>
      current === id || (current != null && !next.some((layer) => layer.id === current))
        ? (next[0]?.id ?? null)
        : current,
    )

    void deleteMapLayer(id).catch(() => {
      // Ignore persistence errors; UI already cleared the layer.
    })
  }

  const mapStations = useMemo(
    () => buildMapStations(layers),
    [layers, stationCatalogVersion],
  )
  const pumpStations = useMemo(
    () => mapStations.filter((station) => station.type === 'pump'),
    [mapStations],
  )
  const rainStations = useMemo(
    () => mapStations.filter((station) => station.type === 'rain'),
    [mapStations],
  )
  const levelStations = useMemo(
    () => mapStations.filter((station) => station.type === 'level'),
    [mapStations],
  )
  const listStations = useMemo(() => {
    if (listType === 'pump') return pumpStations
    if (listType === 'rain') return rainStations
    if (listType === 'level') return levelStations
    return []
  }, [listType, pumpStations, rainStations, levelStations])

  return (
    <div className={styles.page}>
      {MAP_ENABLED ? (
        <DashboardMap
          layers={layers}
          onSelectStation={(station) => {
            setSelectedStation(station)
            setLayersOpen(false)
          }}
        />
      ) : null}

      <header className={styles.topBar}>
        <div className={styles.brand}>
          <img src={logoTlhn} alt="Logo thủy lợi Hà Nội" className={styles.logo} />
          <div className={styles.brandText}>
            <p className={styles.brandTitle}>HỆ THỐNG CƠ SỞ DỮ LIỆU SỐ</p>
            <p className={styles.brandSubtitle}>{APP_COMPANY}</p>
          </div>
        </div>

        <div className={styles.topRight}>
          <div className={styles.stats}>
            <button
              type="button"
              className={`${styles.statBadge} ${listType === 'pump' ? styles.statActive : ''}`}
              aria-expanded={listType === 'pump'}
              onClick={() => openStationList('pump')}
            >
              <span className={styles.statDot} style={{ background: '#0CFF0C' }} />
              <strong>{pumpStations.length}</strong>
              <span>trạm bơm</span>
            </button>

            <button
              type="button"
              className={`${styles.statBadge} ${listType === 'rain' ? styles.statActive : ''}`}
              aria-expanded={listType === 'rain'}
              onClick={() => openStationList('rain')}
            >
              <span className={styles.statDot} style={{ background: '#F4B400' }} />
              <strong>{rainStations.length}</strong>
              <span>Đo mưa</span>
            </button>

            <button
              type="button"
              className={`${styles.statBadge} ${listType === 'level' ? styles.statActive : ''}`}
              aria-expanded={listType === 'level'}
              onClick={() => openStationList('level')}
            >
              <span className={styles.statDot} style={{ background: '#2D7DD2' }} />
              <strong>{levelStations.length}</strong>
              <span>Đo mực nước</span>
            </button>

            {MAP_ENABLED ? (
              <button
                type="button"
                className={`${styles.layersButton} ${layersOpen ? styles.layersButtonActive : ''}`}
                title="Lớp bản đồ"
                aria-expanded={layersOpen}
                onClick={() => {
                  setLayersOpen((open) => {
                    const next = !open
                    if (next) setSelectedStation(null)
                    return next
                  })
                }}
              >
                <Layers size={16} />
                <span>Lớp bản đồ</span>
              </button>
            ) : null}
          </div>

          <time className={styles.clock} dateTime={new Date().toISOString()}>
            {now}
          </time>

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
              <span>{userName}</span>
              <ChevronDown size={16} className={menuOpen ? styles.chevronOpen : undefined} />
            </button>

            {menuOpen ? (
              <div className={styles.dropdown} role="menu">
                <button
                  type="button"
                  className={styles.dropdownItem}
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    navigate(ROUTES.users)
                  }}
                >
                  Quản lý người dùng
                </button>
                <button
                  type="button"
                  className={styles.dropdownItem}
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    logoutCurrentUser('logout')
                    navigate(ROUTES.login)
                  }}
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {MAP_ENABLED &&
      !layersOpen &&
      (!selectedStation ||
        !(selectedStation.hasKmzInfo ?? Boolean(selectedStation.description?.trim()))) ? (
        <aside className={styles.legendPanel}>
          <h2>Chú thích</h2>
          <ul className={styles.legendList}>
            {LEGEND_ITEMS.map((item) => (
              <li key={item.id}>
                <span className={styles.legendDot} style={{ background: item.color }} />
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      {listType ? (
        <StationListPanel
          type={listType}
          stations={listStations}
          onSelect={(station) => {
            setLayersOpen(false)
            if (station.type === 'pump') {
              const routeId = resolvePumpStationRouteId(station)
              if (!routeId) {
                window.alert(
                  'Trạm này chưa có trong hệ thống (scada.station). Đồng bộ danh sách trạm từ backend rồi thử lại.',
                )
                return
              }
              navigate(stationDetailPath(routeId))
              return
            }
            setSelectedStation(station)
          }}
        />
      ) : null}

      {MAP_ENABLED ? (
        <>
          <FeatureInfoPanel
            station={selectedStation}
            canUpdateData={canUpdateStation}
            onClose={() => setSelectedStation(null)}
            onUpdateData={(station) => {
              if (!isSessionAdmin()) {
                window.alert('Chỉ Admin được cập nhật thông tin trạm.')
                return
              }
              const routeId = resolvePumpStationRouteId(station)
              if (!routeId) {
                window.alert(
                  'Trạm này chưa có trong hệ thống (scada.station). Không mở được cập nhật dữ liệu.',
                )
                return
              }
              setSelectedStation(null)
              navigate(stationDataUpdatePath(routeId))
            }}
          />

          <LayerPanel
            open={layersOpen}
            layers={layers}
            selectedLayerId={selectedLayerId}
            onClose={() => setLayersOpen(false)}
            onUpload={handleUpload}
            onSelectLayer={setSelectedLayerId}
            onUpdateLayer={updateLayer}
            onRemoveLayer={removeLayer}
          />
        </>
      ) : null}
    </div>
  )
}
