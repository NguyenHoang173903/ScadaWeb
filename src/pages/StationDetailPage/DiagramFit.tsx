import { useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { flushSync } from "react-dom"
import styles from "./StationPage.module.css"

type DiagramFitProps = {
  designWidth: number
  children: ReactNode
}

/* Desktop + landscape tablet: the diagram page must fit the viewport (no vertical scroll). */
const FIT_HEIGHT_QUERY = "(min-width: 1024px)"
const TOUCH_QUERY = "(hover: none), (pointer: coarse)"
const TABLET_CANVAS_QUERY =
  "(min-width: 768px) and (max-width: 1279px), (min-width: 1280px) and (hover: none) and (pointer: coarse)"
/* Page column width shared by the diagram card, legend and alert bar when the diagram shrinks. */
const COLUMN_VAR = "--diagram-col"

/* Content-box width of the page: natural diagram width, independent of the shared column. */
function pageInnerWidth(page: HTMLElement) {
  const style = getComputedStyle(page)
  return page.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
}

export function DiagramFit({ designWidth, children }: DiagramFitProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const scalerRef = useRef<HTMLDivElement>(null)
  const [adaptive, setAdaptive] = useState(false)
  const [canvasWidth, setCanvasWidth] = useState(designWidth)
  const [contentHeight, setContentHeight] = useState(0)
  /* Fit-height mode (desktop/landscape): scale cap so diagram + alert bar fit the page. */
  const [fitHeightMode, setFitHeightMode] = useState(false)
  const [heightScale, setHeightScale] = useState(1)
  const [naturalWidth, setNaturalWidth] = useState(0)
  const [frameMax, setFrameMax] = useState<number | null>(null)

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
      const nextCanvasWidth = window.matchMedia(TABLET_CANVAS_QUERY).matches
        ? designWidth * 1.4
        : designWidth
      /*
        Fit by the diagram's actual container, not by the viewport. A wide touch device can
        still have little room after the sidebar, while a narrow window may have more.
      */
      const useAdaptiveFit =
        frame.clientWidth < nextCanvasWidth || window.matchMedia(TOUCH_QUERY).matches
      const fitPage = page && window.matchMedia(FIT_HEIGHT_QUERY).matches ? page : null
      const naturalHeight = content.offsetHeight
      setAdaptive(useAdaptiveFit)
      setCanvasWidth(nextCanvasWidth)
      setContentHeight(naturalHeight)
      setFitHeightMode(Boolean(fitPage))

      let maxScalerHeight = Number.POSITIVE_INFINITY
      if (fitPage) {
        const budget = scalerBudget(fitPage)
        maxScalerHeight = budget.maxScalerHeight
        setFrameMax(useAdaptiveFit ? budget.nextFrameMax : null)
      } else {
        setFrameMax(null)
      }

      if (useAdaptiveFit) {
        setNaturalWidth(nextCanvasWidth)
        setHeightScale(1)
        setColumn(null)
        return
      }

      const width = fitPage ? pageInnerWidth(fitPage) : frame.clientWidth
      const nextScale =
        fitPage && naturalHeight > 0 ? Math.min(1, maxScalerHeight / naturalHeight) : 1
      setNaturalWidth(width)
      setHeightScale(nextScale)
      setColumn(fitPage && nextScale < 0.999 ? width * nextScale : null)
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
  }, [designWidth])

  /* Desktop only: shrink (contain) when the diagram is taller than the room left. */
  const desktopShrink = !adaptive && fitHeightMode && heightScale < 0.999 && naturalWidth > 0

  return (
    <div
      ref={frameRef}
      className={`${styles.fitFrame} ${adaptive ? styles.fitFrameAdaptive : ""}`}
      style={frameMax != null ? { maxHeight: frameMax } : undefined}
    >
      <div
        ref={scalerRef}
        className={styles.fitScaler}
        style={
          adaptive
            ? {
                width: canvasWidth,
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
            adaptive
              ? {
                  width: canvasWidth,
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
