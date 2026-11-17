import { Fragment } from 'react'
import { ConsedLogo } from '../components/ConsedLogo'
import type { CasoPageContent, EditorialDocument } from '../content/types'

type CasoPageProps = {
  id: string
  page: CasoPageContent
  publication: Pick<EditorialDocument, 'title' | 'subtitle' | 'masthead'>
  pageNumber: number
  pageCount: number
}

/** Cada bloco do descritor abre com maiúscula. */
function startSentence(text: string) {
  if (!text) return text
  return text.charAt(0).toLocaleUpperCase('pt-BR') + text.slice(1)
}

/**
 * Estudo de caso — uma folha A4 retrato por caso.
 * A folha é fixa (`data-paginate="off"`): o texto não é cortado pelo paginador.
 */
export function CasoPage({ id, page, publication, pageNumber, pageCount }: CasoPageProps) {
  const masthead = publication.masthead ?? {
    note: publication.subtitle,
    footer: publication.title,
  }

  return (
    <article
      id={id}
      className="sheet layout-caso"
      data-layout="caso"
      data-paginate="off"
      data-folio="off"
    >
      <div className="cs-page">
        <header className="cs-head">
          <div className="cs-identity">
            <p className="cs-kicker">
              <span className="cs-badge">CASO {page.number}</span>
              <span className="cs-axis">{page.axis}</span>
            </p>
            <h1 className="cs-title">{page.title}</h1>
            <p className="cs-descriptor">
              {page.descriptor.split(' · ').map((part, index, parts) => (
                <Fragment key={index}>
                  <span className="cs-descriptor-item">{startSentence(part)}</span>
                  {index < parts.length - 1 ? ' ' : null}
                </Fragment>
              ))}
            </p>
            <span className="cs-rule" aria-hidden="true" />
          </div>
        </header>

        <div className="cs-body">
          <div className="cs-lead">
            {page.lead.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {page.sections.map((section, index) => (
            <section className="cs-section" key={index}>
              <h2 className="cs-section-title">{section.title}</h2>
              <div className="cs-columns">
                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <p className="cs-decision">{page.decision}</p>
        </div>

        <footer className="cs-footer">
          <div className="cs-footer-brand-row">
            <ConsedLogo markOnly size={11} />
            <span className="cs-footer-rule" aria-hidden="true" />
          </div>
          <div className="cs-footer-row">
            <span className="cs-footer-note">
              {masthead.footer}{' '}
              <span className="cs-footer-sep" aria-hidden="true" />{' '}
              {masthead.note}
            </span>
            <span className="cs-footer-page">
              {pageNumber} de {pageCount}
            </span>
          </div>
        </footer>
      </div>
    </article>
  )
}
