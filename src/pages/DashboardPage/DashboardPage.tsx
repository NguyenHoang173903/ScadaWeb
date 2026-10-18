import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  KeyRound,
  Layers,
  LogOut,
  Minus,
  Plus,
  RotateCcw,
  UserRound,
  Users,
} from 'lucide-react'
import dashboardMapImage from '@/assets/images/bando.jpg'
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
import {
  getAllPumpStations,
  registerPumpStation,
  resolvePumpStationRouteId,
} from '@/data/pumpStations'
import { logoutCurrentUser } from '@/services/auditLog'
import { getStation, listStations as fetchStationsApi } from '@/services/stations/stationsApi'
import { prefetchStationOverview } from '@/services/stations/stationQueries'
import { getSessionUsername, isSessionAdmin } from '@/settings/session'
import {
  getRuntimeConfig,
  setCurrentDashboardMapView,
  subscribeRuntimeConfig,
} from '@/settings/runtimeConfig'
import {
  deleteMapLayer,
  getMapLayerStorageMode,
  peekCachedMapLayers,
  resolveMapLayers,
  subscribeMapLayers,
  updateMapLayerMeta,
  uploadMapLayer,
} from '@/services/mapLayers'
import { TabularDigits } from '@/components/common/TabularDigits'
import styles from './DashboardPage.module.css'

const LEGEND_ITEMS = [
  { id: 'pump', label: 'Trạm bơm', color: '#0CFF0C' },
  { id: 'rain', label: 'Điểm đo mưa', color: '#F4B400' },
  { id: 'level', label: 'Điểm đo mực nước tự động', color: '#2D7DD2' },
] as const

const MIN_STATIC_MAP_ZOOM = 1
const MAX_STATIC_MAP_ZOOM = 4
const STATIC_MAP_ZOOM_STEP = 0.25

type MapOffset = { x: number; y: number }

function clampStaticMapOffset(
  offset: MapOffset,
  zoom: number,
  pane: HTMLDivElement | null,
  image: HTMLImageElement | null,
): MapOffset {
  if (!pane || !image || !image.naturalWidth || !image.naturalHeight) {
    return offset
  }

  const paneWidth = pane.clientWidth
  const paneHeight = pane.clientHeight
  const imageRatio = image.naturalWidth / image.naturalHeight
  const paneRatio = paneWidth / paneHeight
  const baseWidth = imageRatio > paneRatio ? paneWidth : paneHeight * imageRatio
  const baseHeight = imageRatio > paneRatio ? paneWidth / imageRatio : paneHeight
  const maxX = Math.max(0, (baseWidth * zoom - paneWidth) / 2)
  const maxY = Math.max(0, (baseHeight * zoom - paneHeight) / 2)

  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  }
}

function formatNow(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userName = getSessionUsername() ?? 'Admin'
  const canUpdateStation = isSessionAdmin()
  const initialRuntimeConfig = getRuntimeConfig()
  const initialStaticMapViewRef = useRef({
    zoom: initialRuntimeConfig.dashboardMapZoom,
    x: initialRuntimeConfig.dashboardMapOffsetX,
    y: initialRuntimeConfig.dashboardMapOffsetY,
  })
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
  const [staticMapZoom, setStaticMapZoom] = useState(initialStaticMapViewRef.current.zoom)
  const [staticMapOffset, setStaticMapOffset] = useState({
    x: initialStaticMapViewRef.current.x,
    y: initialStaticMapViewRef.current.y,
  })
  const [isStaticMapDragging, setIsStaticMapDragging] = useState(false)
  const staticMapDragRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  })
  const menuRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const topBarRef = useRef<HTMLElement>(null)
  const staticMapPaneRef = useRef<HTMLDivElement>(null)
  const staticMapImageRef = useRef<HTMLImageElement>(null)
  const staticMapZoomRef = useRef(staticMapZoom)

  // Tablet: the header can wrap to two rows; panels below it read this height.
  useLayoutEffect(() => {
    const page = pageRef.current
    const bar = topBarRef.current
    if (!page || !bar) return
    const sync = () => page.style.setProperty('--dashboard-topbar-height', `${bar.offsetHeight}px`)
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(bar)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    const pane = staticMapPaneRef.current
    if (!pane || MAP_ENABLED) return
    const keepMapInBounds = () => {
      setStaticMapOffset((offset) =>
        clampStaticMapOffset(offset, staticMapZoom, pane, staticMapImageRef.current),
      )
    }
    keepMapInBounds()
    const observer = new ResizeObserver(keepMapInBounds)
    observer.observe(pane)
    return () => observer.disconnect()
  }, [staticMapZoom])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(formatNow(new Date()))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(
    () =>
      subscribeRuntimeConfig((config) => {
        const next = {
          zoom: config.dashboardMapZoom,
          x: config.dashboardMapOffsetX,
          y: config.dashboardMapOffsetY,
        }
        initialStaticMapViewRef.current = next
        setStaticMapZoom(next.zoom)
        setStaticMapOffset({ x: next.x, y: next.y })
      }),
    [],
  )

  useEffect(() => {
    setCurrentDashboardMapView({
      zoom: staticMapZoom,
      offsetX: Math.round(staticMapOffset.x),
      offsetY: Math.round(staticMapOffset.y),
    })
  }, [staticMapZoom, staticMapOffset])

  useEffect(() => {
    staticMapZoomRef.current = staticMapZoom
  }, [staticMapZoom])

  useEffect(() => {
    const pane = staticMapPaneRef.current
    if (!pane || MAP_ENABLED) return

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      if (event.deltaY === 0) return
      const delta = event.deltaY < 0 ? STATIC_MAP_ZOOM_STEP : -STATIC_MAP_ZOOM_STEP
      const nextZoom = Math.min(
        MAX_STATIC_MAP_ZOOM,
        Math.max(MIN_STATIC_MAP_ZOOM, staticMapZoomRef.current + delta),
      )
      staticMapZoomRef.current = nextZoom
      setStaticMapZoom(nextZoom)
      setStaticMapOffset((offset) =>
        clampStaticMapOffset(
          offset,
          nextZoom,
          staticMapPaneRef.current,
          staticMapImageRef.current,
        ),
      )
    }

    pane.addEventListener('wheel', handleWheel, { passive: false })
    return () => pane.removeEventListener('wheel', handleWheel)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const result = await fetchStationsApi()
        if (cancelled) return
        for (const item of result.items ?? []) {
          registerPumpStation({
            id: String(item.id),
            name: item.name,
            code: item.code,
            address: '—',
            status: item.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động',
            isActive: item.isActive,
            online: item.online,
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
                isActive: detail.isActive,
                online: detail.online,
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
  const pumpStations = useMemo(() => {
    const catalog = new Map(
      getAllPumpStations().map((station) => [station.id, station]),
    )
    const isActive = (station: MapStation) => {
      const item = catalog.get(station.routeId ?? station.id)
      return item?.isActive === true
    }

    return mapStations
      .filter((station) => station.type === 'pump')
      .sort(
        (a, b) =>
          Number(isActive(b)) - Number(isActive(a)) ||
          a.name.localeCompare(b.name, 'vi'),
      )
  }, [mapStations, stationCatalogVersion])
  const activePumpStationCount = useMemo(
    () =>
      getAllPumpStations().filter(
        (station) => station.isActive,
      ).length,
    [stationCatalogVersion],
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

  const handleStaticMapPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const target = event.target as HTMLElement
    if (target.closest(`.${styles.staticMapControls}`)) return

    staticMapDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: staticMapOffset.x,
      originY: staticMapOffset.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsStaticMapDragging(true)
  }

  const handleStaticMapPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = staticMapDragRef.current
    if (drag.pointerId !== event.pointerId) return
    setStaticMapOffset(
      clampStaticMapOffset(
        {
          x: drag.originX + event.clientX - drag.startX,
          y: drag.originY + event.clientY - drag.startY,
        },
        staticMapZoom,
        staticMapPaneRef.current,
        staticMapImageRef.current,
      ),
    )
  }

  const stopStaticMapDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (staticMapDragRef.current.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    staticMapDragRef.current.pointerId = -1
    setIsStaticMapDragging(false)
  }

  const resetStaticMap = () => {
    const initial = initialStaticMapViewRef.current
    setStaticMapZoom(initial.zoom)
    setStaticMapOffset({ x: initial.x, y: initial.y })
  }

  const changeStaticMapZoom = (delta: number) => {
    const nextZoom = Math.min(
      MAX_STATIC_MAP_ZOOM,
      Math.max(MIN_STATIC_MAP_ZOOM, staticMapZoom + delta),
    )
    setStaticMapZoom(nextZoom)
    setStaticMapOffset((offset) =>
      clampStaticMapOffset(
        offset,
        nextZoom,
        staticMapPaneRef.current,
        staticMapImageRef.current,
      ),
    )
  }

  return (
    <div ref={pageRef} className={styles.page}>
      {MAP_ENABLED ? (
        <DashboardMap
          layers={layers}
          onSelectStation={(station) => {
            setSelectedStation(station)
            setLayersOpen(false)
          }}
        />
      ) : (
        <div
          ref={staticMapPaneRef}
          className={styles.staticMapPane}
          data-dragging={isStaticMapDragging || undefined}
          onPointerDown={handleStaticMapPointerDown}
          onPointerMove={handleStaticMapPointerMove}
          onPointerUp={stopStaticMapDragging}
          onPointerCancel={stopStaticMapDragging}
        >
          <img
            ref={staticMapImageRef}
            src={dashboardMapImage}
            alt="Bản đồ khu vực thủy lợi Hà Nội"
            className={styles.staticMapImage}
            draggable={false}
            onLoad={() =>
              setStaticMapOffset((offset) =>
                clampStaticMapOffset(
                  offset,
                  staticMapZoom,
                  staticMapPaneRef.current,
                  staticMapImageRef.current,
                ),
              )
            }
            style={{
              transform: `translate(${staticMapOffset.x}px, ${staticMapOffset.y}px) scale(${staticMapZoom})`,
            }}
          />
          <div className={styles.staticMapControls} aria-label="Điều khiển bản đồ">
            <button
              type="button"
              onClick={() => changeStaticMapZoom(-STATIC_MAP_ZOOM_STEP)}
              disabled={staticMapZoom <= MIN_STATIC_MAP_ZOOM}
              title="Thu nhỏ"
              aria-label="Thu nhỏ bản đồ"
            >
              <Minus aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={resetStaticMap}
              disabled={
                staticMapZoom === initialStaticMapViewRef.current.zoom &&
                staticMapOffset.x === initialStaticMapViewRef.current.x &&
                staticMapOffset.y === initialStaticMapViewRef.current.y
              }
              title="Đặt lại vị trí và mức phóng ban đầu"
              aria-label="Đặt lại bản đồ"
            >
              <RotateCcw aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => changeStaticMapZoom(STATIC_MAP_ZOOM_STEP)}
              disabled={staticMapZoom >= MAX_STATIC_MAP_ZOOM}
              title="Phóng to"
              aria-label="Phóng to bản đồ"
            >
              <Plus aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <header ref={topBarRef} className={styles.topBar}>
        <div className={styles.brand}>
          <img src={logoTlhn} alt="Logo thủy lợi Hà Nội" className={styles.logo} />
          <div className={styles.brandText}>
            <p className={styles.brandTitle}>ỦY BAN NHÂN DÂN THÀNH PHỐ HÀ NỘI</p>
            <p className={styles.brandCompany}>{APP_COMPANY}</p>
            <p className={styles.brandSubtitle}>
              PHẦN MỀM TRUY CẬP GIAO DIỆN SCADA THÔNG QUA TRÌNH DUYỆT WEB - WEB
              BROWSER
            </p>
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
              <strong>{activePumpStationCount}</strong>
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
            <TabularDigits value={now} />
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
              <span className={styles.userName}>{userName}</span>
              <ChevronDown size={16} className={menuOpen ? styles.chevronOpen : undefined} />
            </button>

            {menuOpen ? (
              <div className={styles.dropdown} role="menu">
                {canUpdateStation ? (
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    role="menuitem"
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
                  role="menuitem"
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
                  role="menuitem"
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
              if (/^\d+$/.test(routeId)) {
                void prefetchStationOverview(queryClient, Number(routeId))
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
