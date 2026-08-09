import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Layers, LogOut, UserRound, Users } from 'lucide-react'
import logoTlhn from '@/assets/images/Logo_TLHN.svg'
import { DashboardMap, FeatureInfoPanel, LayerPanel, StationListPanel } from '@/components/map'
import {
  buildMapStations,
  type MapStation,
  type MapStationType,
} from '@/components/map/extractStations'
import {
  DEFAULT_CANAL_LAYER_ID,
  DEFAULT_LAYER_STYLE,
  type MapOverlayLayer,
} from '@/components/map/layerTypes'
import {
  disposeLayerMedia,
  disposeLayersMedia,
  importLayerPackage,
  parseLayerUrl,
} from '@/components/map/parseLayerFile'
import { ROUTES, stationDataUpdatePath, stationDetailPath } from '@/constants/routes'
import { ensureMapPumpStation } from '@/data/pumpStations'
import styles from './DashboardPage.module.css'

const LEGEND_ITEMS = [
  { id: 'pump', label: 'Trạm bơm', color: '#0CFF0C' },
  { id: 'rain', label: 'Điểm đo mưa', color: '#F4B400' },
  { id: 'level', label: 'Điểm đo mực nước tự động', color: '#2D7DD2' },
] as const

const DEFAULT_MEDIA_BASE = '/layers/hethongkenh/'

function formatNow(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function layerNameFromFile(fileName: string) {
  return fileName.replace(/\.(kml|kmz)$/i, '') || 'Lớp mới'
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [listType, setListType] = useState<MapStationType | null>(null)
  const [layersOpen, setLayersOpen] = useState(false)
  const [layers, setLayers] = useState<MapOverlayLayer[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [selectedStation, setSelectedStation] = useState<MapStation | null>(null)
  const [now, setNow] = useState(() => formatNow(new Date()))
  const menuRef = useRef<HTMLDivElement>(null)

  const layersRef = useRef<MapOverlayLayer[]>([])
  layersRef.current = layers

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
        const geojson = await parseLayerUrl('/layers/hethongkenh.kml')
        if (cancelled) return

        const canalLayer: MapOverlayLayer = {
          id: DEFAULT_CANAL_LAYER_ID,
          name: 'Hệ thống kênh',
          geojson,
          visible: true,
          opacity: DEFAULT_LAYER_STYLE.opacity,
          weight: DEFAULT_LAYER_STYLE.weight,
          color: DEFAULT_LAYER_STYLE.color,
          mediaBaseUrl: DEFAULT_MEDIA_BASE,
        }

        setLayers([canalLayer])
        setSelectedLayerId(canalLayer.id)
      } catch {
        // Map still works without the default canal layer.
      }
    })()

    return () => {
      cancelled = true
      disposeLayersMedia(layersRef.current)
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
    setListType((current) => (current === type ? null : type))
    setSelectedStation(null)
    setLayersOpen(false)
  }

  const handleUpload = async (file: File) => {
    try {
      const imported = await importLayerPackage(file)
      const id = `layer-${Date.now()}`
      const next: MapOverlayLayer = {
        id,
        name: layerNameFromFile(file.name),
        geojson: imported.geojson,
        visible: true,
        opacity: DEFAULT_LAYER_STYLE.opacity,
        weight: DEFAULT_LAYER_STYLE.weight,
        color: DEFAULT_LAYER_STYLE.color,
        mediaUrls: imported.mediaUrls,
        objectUrls: imported.objectUrls,
      }

      // Replace old layers + revoke previous KMZ blob media (images, ...).
      setLayers((prev) => {
        disposeLayersMedia(prev)
        return [next]
      })
      setSelectedLayerId(id)
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
    setLayers((prev) => prev.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer)))
  }

  const removeLayer = (id: string) => {
    setLayers((prev) => {
      const removed = prev.find((layer) => layer.id === id)
      if (removed) disposeLayerMedia(removed)

      const next = prev.filter((layer) => layer.id !== id)
      setSelectedLayerId((current) => {
        if (current !== id) return current
        return next[0]?.id ?? null
      })
      return next
    })
    setSelectedStation(null)
  }

  const mapStations = useMemo(() => buildMapStations(layers), [layers])
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

  useEffect(() => {
    for (const station of pumpStations) {
      ensureMapPumpStation(station)
    }
  }, [pumpStations])

  return (
    <div className={styles.page}>
      <DashboardMap
        layers={layers}
        onSelectStation={(station) => {
          setSelectedStation(station)
          setListType(null)
          setLayersOpen(false)
        }}
      />

      <header className={styles.topBar}>
        <div className={styles.brand}>
          <img src={logoTlhn} alt="Logo thủy lợi Hà Nội" className={styles.logo} />
          <div className={styles.brandText}>
            <p className={styles.brandTitle}>HỆ THỐNG CƠ SỞ DỮ LIỆU SỐ</p>
            <p className={styles.brandSubtitle}>CÔNG TY TNHH MTV THỦY LỢI HÀ NỘI</p>
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
                setListType(null)
              }}
            >
              <Layers size={16} />
              <span>Lớp bản đồ</span>
            </button>
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
        </div>
      </header>

      {(!selectedStation ||
        !(selectedStation.hasKmzInfo ?? Boolean(selectedStation.description?.trim()))) ? (
        <aside className={`${styles.legendPanel} ${layersOpen ? styles.legendRaised : ''}`}>
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
          onClose={() => setListType(null)}
          onSelect={(station) => {
            setListType(null)
            setLayersOpen(false)
            if (station.type === 'pump') {
              const routeId = ensureMapPumpStation(station)
              navigate(stationDetailPath(routeId))
              return
            }
            setSelectedStation(station)
          }}
        />
      ) : null}

      <FeatureInfoPanel
        station={selectedStation}
        onClose={() => setSelectedStation(null)}
        onUpdateData={(station) => {
          const routeId = station.routeId ?? ensureMapPumpStation(station)
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
    </div>
  )
}
