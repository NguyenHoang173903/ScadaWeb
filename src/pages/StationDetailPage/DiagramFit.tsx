import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { flushSync } from "react-dom"
import styles from "./StationPage.module.css"

type DiagramFitProps = {
  designWidth: number
  children: ReactNode
}

/* Desktop + landscape tablet: the diagram page must fit the viewport (no vertical scroll). */
const FIT_HEIGHT_QUERY = "(min-width: 1200px), (min-width: 901px) and (orientation: landscape)"
/* Page column width shared by the diagram card, legend and alert bar when the diagram shrinks. */
const COLUMN_VAR = "--diagram-col"

/* Content-box width of the page: natural diagram width, independent of the shared column. */
function pageInnerWidth(page: HTMLElement) {
  const style = getComputedStyle(page)
  return page.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
}

const MIN_ZOOM = 1
const MAX_ZOOM = 4

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

export function DiagramFit({ designWidth, children }: DiagramFitProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const scalerRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef(1)
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 1199px)").matches,
  )
  const [fit, setFit] = useState(1)
  const [userZoom, setUserZoom] = useState(1)
  const [contentHeight, setContentHeight] = useState(0)
  /* Fit-height mode (desktop/landscape): scale cap so diagram + alert bar fit the page. */
  const [fitHeightMode, setFitHeightMode] = useState(false)
  const [heightScale, setHeightScale] = useState(1)
  const [naturalWidth, setNaturalWidth] = useState(0)
  const [frameMax, setFrameMax] = useState<number | null>(null)

  useEffect(() => {
    zoomRef.current = userZoom
  }, [userZoom])

  useLayoutEffect(() => {
    const frame = frameRef.current
    const content = contentRef.current
    if (!frame || !content) return

    const page = frame.closest<HTMLElement>(`.${styles.diagramPage}`)

    /*
      Height (px) the scaler may use so every in-flow child of the diagram page
      (diagram panel, legend, alert bar) ends inside the page box. Stable under
      re-scaling: when the frame grows by d the free space shrinks by d.
    */
    const scalerBudget = (fitPage: HTMLElement) => {
      const pageRect = fitPage.getBoundingClientRect()
      const pageStyle = getComputedStyle(fitPage)
      const top = pageRect.top + fitPage.clientTop
      const limit = top + fitPage.clientHeight - parseFloat(pageStyle.paddingBottom)
      let bottom = top + parseFloat(pageStyle.paddingTop)
      for (const child of Array.from(fitPage.children)) {
        const rect = child.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) continue
        bottom = Math.max(bottom, rect.bottom + parseFloat(getComputedStyle(child).marginBottom))
      }
      const free = Math.floor(limit - bottom)
      const nextFrameMax = Math.max(0, Math.floor(frame.offsetHeight + free))
      const frameChrome = frame.scrollHeight - (scalerRef.current?.offsetHeight ?? 0)
      return { nextFrameMax, maxScalerHeight: Math.max(1, nextFrameMax - frameChrome) }
    }

    const setColumn = (width: number | null) => {
      if (!page) return
      if (width == null) page.style.removeProperty(COLUMN_VAR)
      else page.style.setProperty(COLUMN_VAR, `${width}px`)
    }

    const measure = () => {
      const isNarrow = window.matchMedia("(max-width: 1199px)").matches
      const fitPage = page && window.matchMedia(FIT_HEIGHT_QUERY).matches ? page : null
      const naturalHeight = content.offsetHeight
      setNarrow(isNarrow)
      setFitHeightMode(Boolean(fitPage))
      setContentHeight(naturalHeight)

      let maxScalerHeight = Number.POSITIVE_INFINITY
      if (fitPage) {
        const budget = scalerBudget(fitPage)
        maxScalerHeight = budget.maxScalerHeight
        setFrameMax(isNarrow ? budget.nextFrameMax : null)
      } else {
        setFrameMax(null)
      }

      if (!isNarrow) {
        const width = fitPage ? pageInnerWidth(fitPage) : frame.clientWidth
        const nextScale =
          fitPage && naturalHeight > 0 ? Math.min(1, maxScalerHeight / naturalHeight) : 1
        setFit(1)
        setNaturalWidth(width)
        setHeightScale(nextScale)
        setColumn(fitPage && nextScale < 0.999 ? width * nextScale : null)
        return
      }
      setHeightScale(1)
      if (zoomRef.current > 1.02) {
        setColumn(null)
        return
      }
      const avail = fitPage ? pageInnerWidth(fitPage) : frame.clientWidth
      if (avail > 1) {
        const widthFit = (avail - 1) / designWidth
        const heightFit = fitPage && naturalHeight > 0 ? maxScalerHeight / naturalHeight : widthFit
        const nextFit = Math.max(0.05, Math.min(widthFit, heightFit))
        setFit(nextFit)
        setColumn(fitPage && heightFit < widthFit ? designWidth * nextFit : null)
      }
    }

    /* Observer callbacks: commit scale + column together before the next paint (no misaligned flash). */
    const measureNow = () => flushSync(measure)

    measure()
    const observer = new ResizeObserver(measureNow)
    observer.observe(frame)
    observer.observe(content)
    /* The alert bar mounts after alarms load and may wrap: watch page children too. */
    const observeChildren = () => {
      if (!page) return
      observer.observe(page)
      for (const child of Array.from(page.children)) observer.observe(child)
    }
    observeChildren()
    const mutations = page ? new MutationObserver(() => {
      observeChildren()
      measureNow()
    }) : null
    mutations?.observe(page as HTMLElement, { childList: true })
    return () => {
      observer.disconnect()
      mutations?.disconnect()
      setColumn(null)
    }
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
  /* Desktop only: shrink (contain) when the diagram is taller than the room left. */
  const desktopShrink = !narrow && fitHeightMode && heightScale < 0.999 && naturalWidth > 0

  return (
    <div
      ref={frameRef}
      className={styles.fitFrame}
      style={frameMax != null ? { maxHeight: frameMax } : undefined}
    >
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
        ref={scalerRef}
        className={styles.fitScaler}
        style={
          narrow
            ? {
                width: designWidth * scale,
                height: Math.max(contentHeight * scale, 1),
                ...(fitHeightMode ? { marginInline: "auto" } : null),
              }
            : desktopShrink
              ? {
                  width: naturalWidth * heightScale,
                  height: Math.max(contentHeight * heightScale, 1),
                  marginInline: "auto",
                  overflow: "hidden",
                }
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
              : desktopShrink
                ? {
                    width: naturalWidth,
                    maxWidth: "none",
                    transform: `scale(${heightScale})`,
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
