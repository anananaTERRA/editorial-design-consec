type ConsedLogoProps = {
  /** Mark only, no wordmark. */
  markOnly?: boolean
  /** Wordmark size in points. */
  size?: number
  className?: string
}

/**
 * Marca provisória construída a partir dos arcos da identidade CONSED.
 * Substituir pelo arquivo vetorial oficial quando ele chegar.
 */
export function ConsedLogo({ markOnly = false, size = 10, className }: ConsedLogoProps) {
  const classes = ['consed-logo', className].filter(Boolean).join(' ')
  return (
    <span className={classes} style={{ fontSize: `${size}pt` }}>
      <svg className="consed-mark" viewBox="0 0 64 64" aria-hidden="true">
        <g fill="none" strokeLinecap="round">
          <circle
            cx="32"
            cy="32"
            r="26"
            stroke="#64e15e"
            strokeWidth="2.6"
            strokeDasharray="118 56"
            transform="rotate(-58 32 32)"
          />
          <circle
            cx="32"
            cy="32"
            r="21"
            stroke="#3ec1d2"
            strokeWidth="2.6"
            strokeDasharray="86 52"
            transform="rotate(-24 32 32)"
          />
          <circle
            cx="32"
            cy="32"
            r="16"
            stroke="#008ff1"
            strokeWidth="2.6"
            strokeDasharray="54 48"
            transform="rotate(8 32 32)"
          />
          <path
            d="M41 23.5A11.5 11.5 0 1 0 41 40.5"
            stroke="#0b5384"
            strokeWidth="3.6"
          />
        </g>
      </svg>
      {markOnly ? null : <span className="consed-wordmark">CONSED</span>}
    </span>
  )
}
