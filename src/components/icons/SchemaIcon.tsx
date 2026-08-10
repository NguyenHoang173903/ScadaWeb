type SchemaIconProps = {
  size?: number
  className?: string
  color?: string
}

/** Inline schema.svg so fill follows currentColor (sidebar white / topbar brand). */
export function SchemaIcon({ size = 18, className, color = 'currentColor' }: SchemaIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M4.66666 26.8337V20.2225H7.58333V17.3058H4.66666V10.6949H7.58333V7.7782H4.66666V1.16699H12.4445V7.7782H9.52787V10.6949H12.4445V13.0282H16.7221V10.6949H24.5V17.3058H16.7221V14.9725H12.4445V17.3058H9.52787V20.2225H12.4445V26.8337H4.66666ZM6.61121 24.8891H10.5V22.167H6.61121V24.8891ZM6.61121 15.3615H10.5V12.6391H6.61121V15.3615ZM18.6667 15.3615H22.5555V12.6391H18.6667V15.3615ZM6.61121 5.83366H10.5V3.11153H6.61121V5.83366Z"
        fill={color}
      />
    </svg>
  )
}
