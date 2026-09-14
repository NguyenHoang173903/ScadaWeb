import { useEffect, useRef } from 'react'
import {
  subscribeScadaScreen,
  type RealtimeChangedMessage,
  type RealtimeSnapshotDto,
  type ScadaRealtimeScreen,
} from './scadaHub'

type Options = {
  stationId: string | number | undefined
  screen: ScadaRealtimeScreen
  deviceId?: number
  enabled?: boolean
  /** Gọi khi có Snapshot hoặc TagChanged (đã throttle). Dùng để refetch REST. */
  onInvalidate?: () => void
  onSnapshot?: (snapshot: RealtimeSnapshotDto) => void
  onTagChanged?: (message: RealtimeChangedMessage) => void
  /** ms giữa các lần invalidate (mặc định 1000). */
  throttleMs?: number
}

/**
 * Subscribe SignalR `/hubs/scada` cho một màn hình trạm.
 * Pattern BE: Snapshot lần đầu + TagChanged deltas → FE refetch REST (ổn định hơn map tag thủ công).
 */
export function useScadaRealtime({
  stationId,
  screen,
  deviceId,
  enabled = true,
  onInvalidate,
  onSnapshot,
  onTagChanged,
  throttleMs = 1000,
}: Options) {
  const onInvalidateRef = useRef(onInvalidate)
  const onSnapshotRef = useRef(onSnapshot)
  const onTagChangedRef = useRef(onTagChanged)
  onInvalidateRef.current = onInvalidate
  onSnapshotRef.current = onSnapshot
  onTagChangedRef.current = onTagChanged

  useEffect(() => {
    const numericId = typeof stationId === 'number' ? stationId : Number(stationId)
    if (!enabled || !Number.isFinite(numericId) || numericId <= 0) return

    let cancelled = false
    let subscription: Awaited<ReturnType<typeof subscribeScadaScreen>> | null = null
    let timer: number | null = null
    let pending = false

    const scheduleInvalidate = () => {
      pending = true
      if (timer != null) return
      timer = window.setTimeout(() => {
        timer = null
        if (!pending || cancelled) return
        pending = false
        onInvalidateRef.current?.()
      }, throttleMs)
    }

    void (async () => {
      try {
        subscription = await subscribeScadaScreen({
          stationId: numericId,
          screen,
          deviceId,
          onSnapshot: (snapshot) => {
            onSnapshotRef.current?.(snapshot)
            scheduleInvalidate()
          },
          onTagChanged: (message) => {
            onTagChangedRef.current?.(message)
            scheduleInvalidate()
          },
        })
      } catch {
        // Realtime optional — pages keep REST polling/load.
      }
    })()

    return () => {
      cancelled = true
      if (timer != null) window.clearTimeout(timer)
      void subscription?.stop()
    }
  }, [stationId, screen, deviceId, enabled, throttleMs])
}
