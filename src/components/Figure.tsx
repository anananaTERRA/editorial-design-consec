import { assetUrl } from '../lib/assetUrl'
import { parseInlineRuns } from '../content/inline-markdown'
import { renderRuns } from '../content/renderRuns'

type FigureProps = {
  src: string
  alt: string
  caption?: string
  credit?: string
  /** Optional local modifiers, e.g. figure--wide */
  className?: string
}

export function Figure({ src, alt, caption, credit, className }: FigureProps) {
  if (!alt.trim()) {
    throw new Error(`Figure "${src}" needs alt text`)
  }

  const extraClass = className?.trim() ? ` ${className.trim()}` : ''
  const captionText = caption?.trim()
  const creditText = credit?.trim()

  return (
    <figure className={`figure${extraClass}`}>
      <img src={assetUrl(src)} alt={alt} />
      {captionText || creditText ? (
        <figcaption>
          {captionText ? (
            <span className="figure-caption">{renderRuns(parseInlineRuns(captionText))}</span>
          ) : null}
          {creditText ? (
            <span className="figure-credit">{renderRuns(parseInlineRuns(creditText))}</span>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  )
}
