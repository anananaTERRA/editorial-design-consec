import type { CronogramaEntry, CronogramaPageContent } from '../content/types'
import type { LoadedPublication } from '../content/loadDocument'
import { ConsedLogo } from '../components/ConsedLogo'

type CronogramaPageProps = {
  id: string
  page: CronogramaPageContent
  publication: LoadedPublication
}

/**
 * Cronograma — uma ficha A4 paisagem por metade do dia (impressa em A5).
 * A folha é fixa (`data-paginate="off"`): o paginador não corta a ficha.
 */
export function CronogramaPage({ id, page, publication }: CronogramaPageProps) {
  const first = page.entries[0]
  const last = page.entries[page.entries.length - 1]
  const window = first && last ? `${first.start} — ${last.end}` : ''

  return (
    <article
      id={id}
      className="sheet layout-cronograma"
      data-layout="cronograma"
      data-paginate="off"
      data-folio="off"
    >
      <div className="cr-page">
        <header className="cr-header">
          <div className="cr-heading">
            <span className="cr-day">D{page.day}</span>
            <h1 className="cr-title">{page.part}</h1>
          </div>
          <div className="cr-when">
            <p className="cr-date">{page.date}</p>
            <p className="cr-weekday">{page.weekday}</p>
            <p className="cr-window">{window}</p>
          </div>
          <span className="cr-rule" aria-hidden="true" />
        </header>

        <div className="cr-body">
          <ol className="cr-list">
            {page.entries.map((entry) => (
              <Entry key={`${entry.start}-${entry.title}`} entry={entry} />
            ))}
          </ol>
        </div>

        <footer className="cr-footer">
          <ConsedLogo markOnly size={11} />
          <span className="cr-footer-rule" aria-hidden="true" />
          <span className="cr-footer-label">
            {publication.title} · Dia {page.day}
          </span>
        </footer>
      </div>
    </article>
  )
}

function Entry({ entry }: { entry: CronogramaEntry }) {
  const paused = entry.kind === 'pausa'
  return (
    <li className="cr-entry" data-kind={entry.kind}>
      <div className="cr-time">
        <span className="cr-start">{entry.start}</span>
        <span className="cr-end">
          {paused ? `–${entry.end}` : `${entry.end} · ${entry.duration} min`}
        </span>
      </div>
      <div className="cr-content">
        <div className="cr-entry-head">
          <h2 className="cr-entry-title">
            {entry.label || entry.method ? (
              <span className="cr-label">
                {entry.label}
                {entry.label && entry.method ? ' · ' : ''}
                {entry.method}
              </span>
            ) : null}
            {entry.title}
          </h2>
          {paused ? (
            <span className="cr-host">{entry.duration} min</span>
          ) : entry.host ? (
            <span className="cr-host">{entry.host}</span>
          ) : null}
        </div>

        {entry.subtitle ? <p className="cr-entry-sub">{entry.subtitle}</p> : null}
        {entry.description ? <p className="cr-desc">{entry.description}</p> : null}
        {entry.intro ? <p className="cr-desc">{entry.intro}</p> : null}

        {entry.items && entry.items.length > 0 ? (
          <ul className="cr-items">
            {entry.items.map((item, index) => (
              <li key={index}>
                <span className="cr-item-dash" aria-hidden="true">
                  –
                </span>
                <span>
                  {item.strong ? <strong className="cr-item-strong">{item.strong}</strong> : null}
                  {item.strong ? ' ' : ''}
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {entry.paragraphs?.map((paragraph, index) => (
          <p className="cr-desc cr-desc--closing" key={index}>
            {paragraph}
          </p>
        ))}

        {entry.note ? <p className="cr-note">{entry.note}</p> : null}
      </div>
    </li>
  )
}
