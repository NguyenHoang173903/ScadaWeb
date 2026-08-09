import { FileX2, X } from 'lucide-react'
import type { MapStation } from './extractStations'
import { parseDescriptionBlocks } from './parseDescription'
import styles from './FeatureInfoPanel.module.css'

type Props = {
  station: MapStation | null
  onClose: () => void
  onUpdateData?: (station: MapStation) => void
}

export function FeatureInfoPanel({ station, onClose, onUpdateData }: Props) {
  if (!station) return null

  const hasKmzInfo =
    station.hasKmzInfo ?? Boolean(station.description?.trim())
  const blocks = hasKmzInfo && station.description
    ? parseDescriptionBlocks(station.description, station.mediaBaseUrl, station.mediaUrls)
    : []
  const isEmpty = blocks.length === 0

  return (
    <aside
      className={`${styles.panel} ${isEmpty ? styles.panelEmpty : ''}`}
      aria-label={`Thông tin ${station.name}`}
    >
      {isEmpty ? (
        <div className={styles.emptyHeader}>
          <p className={styles.emptyStationName}>{station.name}</p>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Đóng">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className={styles.header}>
          <h2>{station.name}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Đóng">
            <X size={16} />
          </button>
        </div>
      )}

      <div className={`${styles.body} ${isEmpty ? styles.bodyEmpty : ''}`}>
        {!isEmpty ? (
          blocks.map((block, index) => {
            if (block.kind === 'section') {
              return (
                <p key={`s-${index}`} className={styles.section}>
                  {block.title}
                </p>
              )
            }

            if (block.kind === 'row') {
              return (
                <div key={`r-${index}`} className={styles.row}>
                  <span className={styles.label}>{block.label}</span>
                  <span className={styles.value}>{block.value}</span>
                </div>
              )
            }

            if (block.kind === 'images') {
              return (
                <div key={`img-${index}`} className={styles.images}>
                  {block.urls.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className={styles.imageLink}>
                      <img
                        src={url}
                        alt={station.name}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none'
                        }}
                      />
                    </a>
                  ))}
                </div>
              )
            }

            return (
              <p key={`t-${index}`} className={styles.text}>
                {block.text}
              </p>
            )
          })
        ) : (
          <div className={styles.emptyState}>
            <FileX2 className={styles.emptyIcon} size={64} strokeWidth={1.35} />
            <p className={styles.emptyTitle}>Không có dữ liệu</p>
            {station.type === 'pump' ? (
              <button
                type="button"
                className={styles.emptyLink}
                onClick={() => onUpdateData?.(station)}
              >
                Bấm vào đây để cập nhật dữ liệu
              </button>
            ) : (
              <p className={styles.emptyHint}>Chưa có mô tả trong KMZ/KML</p>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
