import { useEffect, useMemo, useRef, useState } from 'react'
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
}

export function ProcessDiagram({ pumps = PROCESS_PUMPS }: ProcessDiagramProps) {
  const svgHostRef = useRef<HTMLDivElement>(null)
  const [svgHtml] = useState(() => prepareInlineSvg(processDiagramSvg))

  const pumpKey = useMemo(
    () => pumps.map((p) => `${p.id}:${p.status}`).join('|'),
    [pumps],
  )

  useEffect(() => {
    const host = svgHostRef.current
    if (!host) return
    applyProcessPumpColors(host, pumps)
  }, [pumpKey, pumps, svgHtml])

  return (
    <div className={styles.diagramLayer}>
      <div
        ref={svgHostRef}
        className={styles.processSvgHost}
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />

      <div className={styles.processBasinLabel}>Bể Xả</div>

      <div className={styles.processRiverRow}>
        <span className={styles.processRiverLabel}>Sông Hồng</span>
        <div className={styles.processWaterBox}>
          <span>Mực nước:</span>
          <strong>35.5m</strong>
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
