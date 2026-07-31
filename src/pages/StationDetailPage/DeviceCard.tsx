import { DeviceIcon } from './DeviceIcon'
import {
  DEVICE_STATUS_META,
  formatMetric,
  type DevicePump,
} from './devicesMock'
import styles from './DevicesPage.module.css'

function ValueChip({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.valueChip}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.fieldRow}>
      <span>{label}</span>
      <strong className={styles.valueBox}>{value}</strong>
    </div>
  )
}

type DeviceCardProps = {
  pump: DevicePump
}

export function DeviceCard({ pump }: DeviceCardProps) {
  const statusMeta = DEVICE_STATUS_META[pump.status]

  return (
    <div className={styles.column}>
      <article className={styles.pumpCard}>
        <header className={styles.cardHead}>
          {pump.label} – {pump.powerKw}kW
        </header>

        <div className={styles.pumpBody}>
          <section className={styles.section}>
            <div className={styles.sectionLabel}>
              Nhiệt độ cuộn dây thực tế (độ C)
            </div>
            <div className={styles.chipRow}>
              <ValueChip label="Cuộn A" value={formatMetric(pump.coilTempActual[0])} />
              <ValueChip label="Cuộn B" value={formatMetric(pump.coilTempActual[1])} />
              <ValueChip label="Cuộn C" value={formatMetric(pump.coilTempActual[2])} />
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionLabel}>
              Nhiệt độ cuộn dây cho phép (độ C)
            </div>
            <div className={styles.chipRow}>
              <ValueChip label="Cuộn A" value={formatMetric(pump.coilTempAllowed[0])} />
              <ValueChip label="Cuộn B" value={formatMetric(pump.coilTempAllowed[1])} />
              <ValueChip label="Cuộn C" value={formatMetric(pump.coilTempAllowed[2])} />
            </div>
          </section>

          <div className={styles.bearingRow}>
            <section className={styles.section}>
              <div className={styles.sectionLabel}>Ổ bi trên (độ C)</div>
              <FieldRow label="Thực tế" value={formatMetric(pump.bearingTop.actual)} />
              <FieldRow label="Cho phép" value={formatMetric(pump.bearingTop.allowed)} />
            </section>
            <section className={styles.section}>
              <div className={styles.sectionLabel}>Ổ bi dưới (độ C)</div>
              <FieldRow
                label="Thực tế"
                value={formatMetric(pump.bearingBottom.actual)}
              />
              <FieldRow
                label="Cho phép"
                value={formatMetric(pump.bearingBottom.allowed)}
              />
            </section>
          </div>

          <div className={styles.bottomRow}>
            <div className={styles.bottomLeft}>
              <section className={styles.section}>
                <div className={styles.sectionLabel}>Mực nước(m)</div>
                <FieldRow label="Sông" value={formatMetric(pump.waterRiverM)} />
                <FieldRow label="Bể xả" value={formatMetric(pump.waterBasinM)} />
              </section>
              <section className={styles.section}>
                <div className={styles.sectionLabel}>Thời gian chạy</div>
                <FieldRow label="Tức thời" value={pump.runtimeInstant} />
                <FieldRow label="Tổng" value={pump.runtimeTotal} />
              </section>
            </div>

            <div className={styles.iconWrap}>
              <DeviceIcon status={pump.status} />
            </div>
          </div>
        </div>

        <div
          className={styles.statusBar}
          style={{ background: statusMeta.color }}
          data-status={pump.status}
        >
          {statusMeta.label}
        </div>
      </article>

      <article className={styles.electricalCard}>
        <div className={styles.electricalHead}>Thông số điện</div>
        <div className={styles.electricalBody}>
          {[
            ['Điện áp dây RS (V)', pump.voltageRs.toFixed(1)],
            ['Điện áp dây ST (V)', pump.voltageSt.toFixed(1)],
            ['Điện áp dây TR (V)', pump.voltageTr.toFixed(1)],
            ['Dòng điện (A)', pump.currentA.toFixed(1)],
            ['Hệ số công suất', pump.powerFactor.toFixed(2)],
            ['Tần số (Hz)', pump.frequencyHz.toFixed(2)],
            ['Công suất (kW)', pump.powerKwValue.toFixed(2)],
            ['Điện năng tiêu thụ (kWh)', pump.energyKwh.toFixed(2)],
          ].map(([label, value]) => (
            <div key={label} className={styles.electricalRow}>
              <span>{label}</span>
              <strong className={styles.valueBox}>{value}</strong>
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}
