import type {
  CronogramaCue,
  CronogramaEntry,
  CronogramaPageContent,
  CronogramaSlot,
} from '../content/types'

type CronogramaPageProps = {
  id: string
  page: CronogramaPageContent
}

/**
 * Cronograma — uma ficha A4 paisagem por parte do dia (impressa em A5).
 * A folha é fixa (`data-paginate="off"`): o paginador não corta a ficha.
 */
export function CronogramaPage({ id, page }: CronogramaPageProps) {
  const slots = page.entries.filter((entry): entry is CronogramaSlot => entry.kind !== 'mc')
  const first = slots[0]
  const last = slots[slots.length - 1]
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
            <span className="cr-day">Dia {page.day}</span>
            <div className="cr-heading-copy">
              <h1 className="cr-title">{page.part}</h1>
              <p className="cr-when">
                {page.date} · {page.weekday} · {window}
              </p>
            </div>
          </div>
          <span className="cr-rule" aria-hidden="true" />
        </header>

        <div className="cr-body">
          <ol className="cr-list">
            {groupEntries(page.entries).map((group, groupIndex) => (
              <li className="cr-group" key={groupIndex}>
                {group.map((entry, index) =>
                  entry.kind === 'mc' ? (
                    <Cue key={`mc-${index}`} entry={entry} />
                  ) : (
                    <Slot key={`${entry.start}-${entry.title}`} entry={entry} />
                  ),
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  )
}

function Cue({ entry }: { entry: CronogramaCue }) {
  return (
    <div className="cr-entry" data-kind="mc">
      <div className="cr-time">
        <span className="cr-mc">MC</span>
      </div>
      <p className="cr-cue">{entry.text}</p>
    </div>
  )
}

function Slot({ entry }: { entry: CronogramaSlot }) {
  const paused = entry.kind === 'pausa'
  return (
    <div className="cr-entry" data-kind={entry.kind} data-tone={entry.tone}>
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
              <>
                <span className="cr-label">
                  {entry.label}
                  {entry.label && entry.method ? ' · ' : ''}
                  {entry.method}
                </span>{' '}
              </>
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

        {entry.supplies ? (
          <p className="cr-supplies">
            <span className="cr-supplies-label">Insumos</span>{' '}
            {entry.supplies}
          </p>
        ) : null}

        {entry.note ? <p className="cr-note">{entry.note}</p> : null}
      </div>
    </div>
  )
}

/** Keeps an MC cue attached to the block it introduces. */
function groupEntries(entries: CronogramaEntry[]): CronogramaEntry[][] {
  const groups: CronogramaEntry[][] = []
  let pending: CronogramaEntry[] = []
  for (const entry of entries) {
    if (entry.kind === 'mc') {
      pending.push(entry)
      continue
    }
    groups.push([...pending, entry])
    pending = []
  }
  if (pending.length > 0) {
    if (groups.length > 0) groups[groups.length - 1].push(...pending)
    else groups.push(pending)
  }
  return groups
}
