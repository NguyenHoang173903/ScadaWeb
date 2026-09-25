import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import processDiagramSvg from '@/assets/images/sdcn_1.svg?raw'
import { processPumpLeftPercent } from './processLayout'
import {
  PROCESS_PUMPS,
  applyProcessPumpColors,
  formatOne,
  type ProcessPumpCard,
  type ProcessPumpStatus,
} from './processMock'
import styles from './StationPage.module.css'

function prepareInlineSvg(raw: string) {
  return raw
    .replace(/<\?xml[^>]*>/i, '')
    .replace(/<svg([^>]*)>/i, `<svg$1 role="img" aria-label="Sơ đồ công nghệ trạm bơm">`)
}

type ProcessDiagramProps = {
  /** Trạng thái runtime từng bơm — đổi màu fill phần vàng */
  pumps?: ProcessPumpCard[]
  riverLevel?: number | null
}

export function ProcessDiagram({
  pumps = PROCESS_PUMPS,
  riverLevel,
}: ProcessDiagramProps) {
  const svgHostRef = useRef<HTMLDivElement>(null)
  const [svgHtml] = useState(() => prepareInlineSvg(processDiagramSvg))
  // Keep the inline SVG DOM intact while realtime measurements re-render cards.
  const svgMarkup = useMemo(() => ({ __html: svgHtml }), [svgHtml])

  const pumpKey = useMemo(
    () => pumps.map((p) => `${p.id}:${p.status}`).join('|'),
    [pumps],
  )
  const pumpStatusRef = useRef<Pick<ProcessPumpCard, 'id' | 'status'>[]>([])
  pumpStatusRef.current = pumps.map(({ id, status }) => ({ id, status }))

  useLayoutEffect(() => {
    const host = svgHostRef.current
    if (!host) return
    applyProcessPumpColors(host, pumpStatusRef.current)
  }, [pumpKey, svgHtml])

  return (
    <div className={styles.diagramLayer}>
      <div
        ref={svgHostRef}
        className={styles.processSvgHost}
        dangerouslySetInnerHTML={svgMarkup}
      />

      <div className={styles.processBasinLabel}>Bể Xả</div>

      <div className={styles.processRiverRow}>
        <span className={styles.processRiverLabel}>Sông Hồng</span>
        <div className={styles.processWaterBox}>
          <span>Mực nước:</span>
          <strong>
            {typeof riverLevel === 'number' && Number.isFinite(riverLevel)
              ? `${formatOne(riverLevel)}m`
              : '—'}
          </strong>
        </div>
      </div>

      {pumps.map((pump) => {
        const left = processPumpLeftPercent(pump.id)
        if (!left) return null
        return (
          <article
            key={pump.id}
            className={`${styles.pumpCard} ${styles.processPumpCard}`}
            style={{ left }}
            data-status={pump.status}
          >
            <header className={styles.pumpCardHead}>
              {pump.label} - {pump.powerKw}kW
            </header>
            <div className={styles.pumpCardBody}>
              <div>
                <span>Dòng điện:</span>
                <strong>{formatOne(pump.currentA)}A</strong>
              </div>
              <div>
                <span>T.Gian:</span>
                <strong>{pump.runtimeH}h</strong>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export type { ProcessPumpCard, ProcessPumpStatus }
