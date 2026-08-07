import { X } from 'lucide-react'
import { getPumpStationById } from '@/data/pumpStations'
import { type MapStation, type MapStationType } from './extractStations'
import styles from './StationListPanel.module.css'

const TYPE_TITLE: Record<MapStationType, string> = {
  pump: 'DANH SÁCH TRẠM BƠM',
  rain: 'DANH SÁCH ĐO MƯA',
  level: 'DANH SÁCH ĐO MỰC NƯỚC',
}

const ONLINE_COLOR = '#0CFF0C'
const OFFLINE_COLOR = '#F07167'

type Props = {
  type: MapStationType
  stations: MapStation[]
  onClose: () => void
  onSelect: (station: MapStation) => void
}

function resolveCard(station: MapStation) {
  const catalog = getPumpStationById(station.routeId ?? station.id)
  const fallbackCode =
    station.id
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 10)
      .toUpperCase() || '—'
  const code = catalog?.code ?? fallbackCode

  const online = catalog ? catalog.status === 'Đang hoạt động' : true
  const statusLabel = online ? 'Online' : 'Offline'
  const statusColor = online ? ONLINE_COLOR : OFFLINE_COLOR

  return {
    name: catalog?.name ?? station.name,
    code,
    online,
    statusLabel,
    statusColor,
    dotColor: statusColor,
  }
}

export function StationListPanel({ type, stations, onClose, onSelect }: Props) {
  return (
    <aside className={styles.panel} aria-label={TYPE_TITLE[type]}>
      <div className={styles.header}>
        <h2>{TYPE_TITLE[type]}</h2>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Đóng">
          <X size={18} />
        </button>
      </div>

      <div className={styles.list}>
        {stations.length === 0 ? (
          <p className={styles.empty}>Chưa có điểm từ KMZ/KML</p>
        ) : (
          stations.map((station) => {
            const card = resolveCard(station)
            return (
              <button
                key={station.id}
                type="button"
                className={styles.card}
                onClick={() => onSelect(station)}
              >
                <span className={styles.dot} style={{ background: card.dotColor }} />
                <span className={styles.meta}>
                  <span className={styles.name}>{card.name}</span>
                  <span className={styles.code}>{card.code}</span>
                </span>
                <span
                  className={`${styles.badge} ${card.online ? styles.badgeOnline : styles.badgeOffline}`}
                >
                  {card.statusLabel}
                </span>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}
