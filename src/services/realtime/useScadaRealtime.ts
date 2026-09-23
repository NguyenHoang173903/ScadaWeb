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
  /** Chu kỳ REST fallback khi SignalR mất kết nối/subscription (mặc định 5000ms). */
  pollIntervalMs?: number
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
  pollIntervalMs = 5000,
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
    let pollTimer: number | null = null
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

    // SignalR reconnects do not guarantee that the server-side group subscription
    // still exists. Periodic REST invalidation keeps operational values fresh when
    // the hub fails initially, reconnects, or misses an event.
    if (pollIntervalMs > 0) {
      pollTimer = window.setInterval(scheduleInvalidate, pollIntervalMs)
    }

    return () => {
      cancelled = true
      if (timer != null) window.clearTimeout(timer)
      if (pollTimer != null) window.clearInterval(pollTimer)
      void subscription?.stop()
    }
  }, [stationId, screen, deviceId, enabled, throttleMs, pollIntervalMs])
}
