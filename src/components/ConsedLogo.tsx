import marcaConsed from '../assets/consec-marca.png'

type ConsedLogoProps = {
  /** Mark only, no wordmark. */
  markOnly?: boolean
  /** Wordmark size in points. */
  size?: number
  className?: string
}

/**
 * Marca CONSED: arte oficial extraída do deck de identidade
 * (`_entrada/marca/consec_identidadevisual.pdf`, 184 × 184 px, fundo transparente).
 * O arquivo vetorial oficial ainda não existe no projeto; quando chegar,
 * basta substituir `src/assets/consec-marca.png`.
 */
export function ConsedLogo({ markOnly = false, size = 10, className }: ConsedLogoProps) {
  const classes = ['consed-logo', className].filter(Boolean).join(' ')
  return (
    <span className={classes} style={{ fontSize: `${size}pt` }}>
      <img
        className="consed-mark"
        src={marcaConsed}
        alt={markOnly ? 'CONSED' : ''}
        aria-hidden={markOnly ? undefined : true}
      />
      {markOnly ? null : <span className="consed-wordmark">CONSED</span>}
    </span>
  )
}
