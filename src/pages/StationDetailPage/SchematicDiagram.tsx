import { useEffect, useMemo, useRef, useState } from 'react'
import schematicDiagramSvg from '@/assets/images/sdnl_3.svg?raw'
import { schematicPumpLeftPercent } from './schematicLayout'
import {
  ELECTRICAL_PARAMS,
  PUMP_BRANCHES,
  applySchematicPumpColors,
  formatOne,
  formatTwo,
  type ElectricalParams,
  type PumpBranch,
} from './schematicMock'
import styles from './StationPage.module.css'

function prepareInlineSvg(raw: string) {
  return raw
    .replace(/<\?xml[^>]*>/i, '')
    .replace(
      /<svg([^>]*)>/i,
      `<svg$1 role="img" aria-label="Sơ đồ nguyên lý trạm bơm" class="${styles.diagram}">`,
    )
}

type SchematicDiagramProps = {
  /** Trạng thái runtime từng bơm — đổi màu KĐM + motor */
  pumps?: PumpBranch[]
  electrical?: ElectricalParams
}

export function SchematicDiagram({
  pumps = PUMP_BRANCHES,
  electrical = ELECTRICAL_PARAMS,
}: SchematicDiagramProps) {
  const e = electrical
  const svgHostRef = useRef<HTMLDivElement>(null)
  const [svgHtml] = useState(() => prepareInlineSvg(schematicDiagramSvg))

  const pumpKey = useMemo(
    () =>
      pumps
        .map(
          (p) =>
            `${p.id}:${p.motorStatus}/${p.kdmStatus}/${p.lockStatus}`,
        )
        .join('|'),
    [pumps],
  )

  useEffect(() => {
    const host = svgHostRef.current
    if (!host) return
    applySchematicPumpColors(host, pumps)
  }, [pumpKey, pumps, svgHtml])

  return (
    <div className={styles.diagramStage}>
      <div className={`${styles.diagramInner} ${styles.schematicInner}`}>
        <div className={styles.diagramLayer}>
          <div
            ref={svgHostRef}
            className={styles.processSvgHost}
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />

          <aside className={styles.electricalBox} aria-label="Thông số điện">
            <div className={styles.electricalHead}>Thông số điện</div>
            <ul className={styles.electricalBody}>
              <li>
                <span>Điện áp dây RS:</span>
                <strong>
                  {formatOne(e.voltageRs)} <em>(V)</em>
                </strong>
              </li>
              <li>
                <span>Điện áp dây ST:</span>
                <strong>
                  {formatOne(e.voltageSt)} <em>(V)</em>
                </strong>
              </li>
              <li>
                <span>Điện áp dây RT:</span>
                <strong>
                  {formatOne(e.voltageRt)} <em>(V)</em>
                </strong>
              </li>
              <li>
                <span>Dòng điện:</span>
                <strong>
                  {formatOne(e.current)} <em>(A)</em>
                </strong>
              </li>
              <li>
                <span>Hệ số công suất:</span>
                <strong>{formatTwo(e.powerFactor)}</strong>
              </li>
              <li>
                <span>Tần số:</span>
                <strong>
                  {formatTwo(e.frequency)} <em>(Hz)</em>
                </strong>
              </li>
              <li>
                <span>Công suất:</span>
                <strong>
                  {formatTwo(e.powerKw)} <em>(kW)</em>
                </strong>
              </li>
              <li>
                <span>Điện năng tiêu thụ:</span>
                <strong>
                  {formatTwo(e.energyKwh)} <em>(kWh)</em>
                </strong>
              </li>
            </ul>
          </aside>

          {pumps.map((pump) => {
            const left = schematicPumpLeftPercent(pump.id)
            if (!left) return null
            return (
              <div
                key={`m-${pump.id}`}
                className={styles.measureBox}
                style={{ left }}
                aria-label={`Thông số ${pump.label}`}
              >
                <div>
                  <span>I1:</span>
                  <strong>{formatOne(pump.i1)}</strong>
                </div>
                <div>
                  <span>I2:</span>
                  <strong>{formatOne(pump.i2)}</strong>
                </div>
                <div>
                  <span>I3:</span>
                  <strong>{formatOne(pump.i3)}</strong>
                </div>
                <div>
                  <span>V1:</span>
                  <strong>{formatOne(pump.v1)}</strong>
                </div>
                <div>
                  <span>V2:</span>
                  <strong>{formatOne(pump.v2)}</strong>
                </div>
                <div>
                  <span>V3:</span>
                  <strong>{formatOne(pump.v3)}</strong>
                </div>
              </div>
            )
          })}

          {pumps.map((pump) => {
            const left = schematicPumpLeftPercent(pump.id)
            if (!left) return null
            return (
              <article
                key={`c-${pump.id}`}
                className={`${styles.pumpCard} ${styles.schematicPumpCard}`}
                style={{ left }}
                data-status={pump.motorStatus}
              >
                <header className={styles.pumpCardHead}>
                  {pump.label} - {pump.powerKw}kW
                </header>
                <div className={styles.pumpCardBody}>
                  <div>
                    <span>Dòng điện:</span>
                    <strong>
                      {formatOne(pump.currentA)} <em>(A)</em>
                    </strong>
                  </div>
                  <div>
                    <span>T.gian:</span>
                    <strong>
                      {pump.runtimeH} <em>(h)</em>
                    </strong>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <ul className={styles.schematicLegend} aria-label="Chú thích trạng thái">
        <li>
          <span className={`${styles.legendDot} ${styles.dotRunning}`} />
          Đang chạy
        </li>
        <li>
          <span className={`${styles.legendDot} ${styles.dotError}`} />
          Lỗi
        </li>
        <li>
          <span className={`${styles.legendDot} ${styles.dotStopped}`} />
          Dừng
        </li>
        <li>
          <span className={`${styles.legendDot} ${styles.dotMaintenance}`} />
          Đang bảo trì, sửa chữa
        </li>
        <li>
          <span className={`${styles.legendDot} ${styles.dotUnknown}`} />
          Không xác định
        </li>
      </ul>
    </div>
  )
}
