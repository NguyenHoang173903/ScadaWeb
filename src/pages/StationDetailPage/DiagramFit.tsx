import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import styles from "./StationPage.module.css"

type DiagramFitProps = {
  designWidth: number
  children: ReactNode
}

const MIN_ZOOM = 1
const MAX_ZOOM = 4

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

export function DiagramFit({ designWidth, children }: DiagramFitProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef(1)
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches,
  )
  const [fit, setFit] = useState(1)
  const [userZoom, setUserZoom] = useState(1)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    zoomRef.current = userZoom
  }, [userZoom])

  useLayoutEffect(() => {
    const frame = frameRef.current
    const content = contentRef.current
    if (!frame || !content) return

    const measure = () => {
      const isNarrow = window.matchMedia("(max-width: 900px)").matches
      setNarrow(isNarrow)
      setContentHeight(content.offsetHeight)
      if (!isNarrow) {
        setFit(1)
        return
      }
      if (zoomRef.current > 1.02) return
      const avail = frame.clientWidth
      if (avail > 1) setFit((avail - 1) / designWidth)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    observer.observe(content)
    return () => observer.disconnect()
  }, [designWidth, userZoom])

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    let startDist = 0
    let startZoom = 1

    const distance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.hypot(dx, dy)
    }

    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) return
      startDist = distance(event.touches)
      startZoom = zoomRef.current
    }

    const onMove = (event: TouchEvent) => {
      if (event.touches.length !== 2 || startDist <= 0) return
      event.preventDefault()
      const next = clampZoom(startZoom * (distance(event.touches) / startDist))
      setUserZoom(next)
    }

    const onEnd = () => {
      startDist = 0
    }

    frame.addEventListener("touchstart", onStart, { passive: true })
    frame.addEventListener("touchmove", onMove, { passive: false })
    frame.addEventListener("touchend", onEnd)
    frame.addEventListener("touchcancel", onEnd)
    return () => {
      frame.removeEventListener("touchstart", onStart)
      frame.removeEventListener("touchmove", onMove)
      frame.removeEventListener("touchend", onEnd)
      frame.removeEventListener("touchcancel", onEnd)
    }
  }, [])

  const scale = narrow ? fit * userZoom : 1
  const fitted = userZoom <= 1.02

  return (
    <div ref={frameRef} className={styles.fitFrame}>
      {narrow ? (
        <div className={styles.fitTools}>
          <button
            type="button"
            className={styles.fitButton}
            onClick={() => setUserZoom((zoom) => clampZoom(zoom / 1.25))}
            disabled={fitted}
            aria-label="Thu nhỏ"
          >
            -
          </button>
          <button
            type="button"
            className={styles.fitButton}
            onClick={() => setUserZoom(1)}
            aria-label="Vừa màn hình"
          >
            Vừa màn hình
          </button>
          <button
            type="button"
            className={styles.fitButton}
            onClick={() => setUserZoom((zoom) => clampZoom(zoom * 1.25))}
            disabled={userZoom >= MAX_ZOOM - 0.01}
            aria-label="Phóng to"
          >
            +
          </button>
        </div>
      ) : null}
      <div
        className={styles.fitScaler}
        style={
          narrow
            ? { width: designWidth * scale, height: Math.max(contentHeight * scale, 1) }
            : undefined
        }
      >
        <div
          ref={contentRef}
          className={styles.fitContent}
          style={
            narrow
              ? {
                  width: designWidth,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }
              : undefined
          }
        >
          {children}
        </div>
      </div>
    </div>
  )
}
