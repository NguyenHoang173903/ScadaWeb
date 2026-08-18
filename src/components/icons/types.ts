import type { ComponentType } from 'react'

/** Props shared by Lucide icons and custom SVG icons used in nav/topbar. */
export type AppIconProps = {
  size?: number | string
  className?: string
  color?: string
}

export type AppIcon = ComponentType<AppIconProps>

export function resolveIconSize(size: number | string | undefined, fallback = 18): number {
  if (typeof size === 'number' && Number.isFinite(size)) return size
  if (typeof size === 'string') {
    const parsed = Number.parseFloat(size)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}
