import { resolveIconSize, type AppIconProps } from './types'

/** Inline trend.svg so fill follows currentColor (sidebar white / topbar brand). */
export function TrendIcon({ size = 18, className, color = 'currentColor' }: AppIconProps) {
  const dim = resolveIconSize(size)
  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M3.5 24.5V22.1667L5.83333 19.8333V24.5H3.5ZM8.16667 24.5V17.5L10.5 15.1667V24.5H8.16667ZM12.8333 24.5V15.1667L15.1667 17.5292V24.5H12.8333ZM17.5 24.5V17.5292L19.8333 15.1958V24.5H17.5ZM22.1667 24.5V12.8333L24.5 10.5V24.5H22.1667ZM3.5 18.4625V15.1667L11.6667 7L16.3333 11.6667L24.5 3.5V6.79583L16.3333 14.9625L11.6667 10.2958L3.5 18.4625Z"
        fill={color}
      />
    </svg>
  )
}
