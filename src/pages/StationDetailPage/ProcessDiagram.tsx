import { useEffect, useMemo, useRef, useState } from 'react'
import processDiagramSvg from '@/assets/images/sdcn.svg?raw'
import {
  PROCESS_PUMPS,
  PROCESS_WIDTH,
  applyProcessPumpColors,
  formatOne,
  type ProcessPumpCard,
  type ProcessPumpStatus,
} from './processMock'
import styles from './StationPage.module.css'

function leftPercent(x: number) {
  return `${(x / PROCESS_WIDTH) * 100}%`
}

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

      {pumps.map((pump) => (
        <article
          key={pump.id}
          className={`${styles.pumpCard} ${styles.processPumpCard}`}
          style={{ left: leftPercent(pump.x) }}
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
      ))}
    </div>
  )
}

export type { ProcessPumpCard, ProcessPumpStatus }
