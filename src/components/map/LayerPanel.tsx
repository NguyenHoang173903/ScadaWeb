import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, Trash2, Upload, X } from 'lucide-react'
import {
  getLoginLayerVisible,
  setLoginLayerVisible,
  subscribeLoginLayerVisible,
} from '@/settings/loginLayerSettings'
import type { MapOverlayLayer } from './layerTypes'
import styles from './LayerPanel.module.css'

type Props = {
  open: boolean
  layers: MapOverlayLayer[]
  selectedLayerId: string | null
  onClose: () => void
  onUpload: (file: File) => void
  onSelectLayer: (id: string) => void
  onUpdateLayer: (id: string, patch: Partial<Pick<MapOverlayLayer, 'opacity' | 'weight' | 'visible'>>) => void
  onRemoveLayer: (id: string) => void
}

export function LayerPanel({
  open,
  layers,
  selectedLayerId,
  onClose,
  onUpload,
  onSelectLayer,
  onUpdateLayer,
  onRemoveLayer,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const selected = layers.find((layer) => layer.id === selectedLayerId) ?? layers[0] ?? null
  const [loginVisible, setLoginVisible] = useState(getLoginLayerVisible)

  useEffect(() => subscribeLoginLayerVisible(setLoginVisible), [])

  if (!open) return null

  return (
    <aside className={styles.panel} aria-label="Lớp bản đồ">
      <div className={styles.header}>
        <h2>Lớp bản đồ</h2>
        <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Đóng">
          <X size={16} />
        </button>
      </div>

      <div className={styles.body}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".kml,.kmz"
          className={styles.hiddenInput}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onUpload(file)
            event.target.value = ''
          }}
        />

        <button
          type="button"
          className={styles.uploadButton}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={18} />
          <span>Tải lên KML/KMZ (thay thế lớp hiện tại)</span>
        </button>

        {layers.length > 1 ? (
          <div className={styles.layerTabs}>
            {layers.map((layer) => (
              <button
                key={layer.id}
                type="button"
                className={`${styles.layerTab} ${
                  selected?.id === layer.id ? styles.layerTabActive : ''
                }`}
                onClick={() => onSelectLayer(layer.id)}
              >
                {layer.name}
              </button>
            ))}
          </div>
        ) : null}

        {selected ? (
          <div className={styles.config}>
            <p className={styles.configTitle}>Cấu hình: {selected.name}</p>

            <label className={styles.sliderRow}>
              <span>Độ mờ</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(selected.opacity * 100)}
                onChange={(event) =>
                  onUpdateLayer(selected.id, { opacity: Number(event.target.value) / 100 })
                }
              />
              <strong>{Math.round(selected.opacity * 100)}%</strong>
            </label>

            <label className={styles.sliderRow}>
              <span>Độ dày</span>
              <input
                type="range"
                min={1}
                max={8}
                step={0.1}
                value={selected.weight}
                onChange={(event) =>
                  onUpdateLayer(selected.id, { weight: Number(event.target.value) })
                }
              />
              <strong>{Math.round((selected.weight / 8) * 100)}%</strong>
            </label>

            <div className={styles.visibilityRow}>
              <span>Cài đặt layer login</span>
              <div className={styles.visibilityOptions}>
                <button
                  type="button"
                  className={`${styles.visibilityOption} ${
                    !loginVisible ? styles.visibilityActive : ''
                  }`}
                  onClick={() => setLoginLayerVisible(false)}
                >
                  <span className={`${styles.checkbox} ${!loginVisible ? styles.checkboxOn : ''}`}>
                    {!loginVisible ? '✓' : null}
                  </span>
                  Ẩn
                </button>
                <button
                  type="button"
                  className={`${styles.visibilityOption} ${
                    loginVisible ? styles.visibilityActive : ''
                  }`}
                  onClick={() => setLoginLayerVisible(true)}
                >
                  <span className={`${styles.checkbox} ${loginVisible ? styles.checkboxOn : ''}`}>
                    {loginVisible ? '✓' : null}
                  </span>
                  Hiện
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className={styles.empty}>Chưa có lớp nào. Hãy tải lên KML/KMZ.</p>
        )}
      </div>

      {selected ? (
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.showButton}
            onClick={() => onUpdateLayer(selected.id, { visible: !selected.visible })}
          >
            {selected.visible ? <Eye size={15} /> : <EyeOff size={15} />}
            {selected.visible ? 'Hiện' : 'Ẩn'}
          </button>
          <button
            type="button"
            className={styles.deleteButton}
            onClick={() => onRemoveLayer(selected.id)}
          >
            <Trash2 size={15} />
            Xoá
          </button>
        </div>
      ) : null}
    </aside>
  )
}
