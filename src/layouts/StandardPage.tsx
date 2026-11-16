import type { ReactNode } from 'react'
import { Cover } from '../components/Cover'
import { Masthead } from '../components/Masthead'
import type { EditorialDocument } from '../content/types'

type StandardPageProps = {
  id: string
  kicker?: string
  sheetVariant?: string
  folio?: 'on' | 'off'
  showMasthead: boolean
  publication: Pick<EditorialDocument, 'title' | 'subtitle' | 'author'>
  children: ReactNode
}

export function StandardPage({
  id,
  kicker,
  sheetVariant,
  folio,
  showMasthead,
  publication,
  children,
}: StandardPageProps) {
  const isCover = sheetVariant === 'cover'
  const variantClass = sheetVariant ? ` layout-${sheetVariant}` : ''
  const hasHeader = !isCover && (showMasthead || Boolean(kicker))

  return (
    <article
      id={id}
      className={`sheet layout-standard${variantClass}`}
      data-layout="standard"
      {...(folio === 'off' ? { 'data-folio': 'off' } : {})}
    >
      <div className="page-frame">
        {hasHeader ? (
          <header className="page-header">
            {showMasthead ? <Masthead publication={publication} /> : null}
            {kicker ? <p className="kicker">{kicker}</p> : null}
          </header>
        ) : null}
        <div className="page-body">
          {isCover ? <Cover publication={publication} /> : children}
        </div>
      </div>
    </article>
  )
}
