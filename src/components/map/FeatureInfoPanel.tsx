import { X } from 'lucide-react'
import type { MapStation } from './extractStations'
import { parseDescriptionBlocks } from './parseDescription'
import styles from './FeatureInfoPanel.module.css'

type Props = {
  station: MapStation | null
  onClose: () => void
}

export function FeatureInfoPanel({ station, onClose }: Props) {
  if (!station) return null

  const blocks = station.description
    ? parseDescriptionBlocks(station.description, station.mediaBaseUrl, station.mediaUrls)
    : []

  return (
    <aside className={styles.panel} aria-label={`Thông tin ${station.name}`}>
      <div className={styles.header}>
        <h2>{station.name}</h2>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Đóng">
          <X size={16} />
        </button>
      </div>

      <div className={styles.body}>
        {blocks.length > 0 ? (
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
          <p className={styles.empty}>Không có thông tin mô tả trong KMZ/KML</p>
        )}
      </div>
    </aside>
  )
}
