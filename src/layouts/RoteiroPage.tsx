import type { RoteiroPageContent, RoteiroQuestion } from '../content/types'
import { ConsedLogo } from '../components/ConsedLogo'

type RoteiroPageProps = {
  id: string
  page: RoteiroPageContent
}

/**
 * Roteiro de conversa — uma folha A4 paisagem por convidado.
 * A folha é fixa (`data-paginate="off"`): o paginador não corta o roteiro.
 */
export function RoteiroPage({ id, page }: RoteiroPageProps) {
  return (
    <article
      id={id}
      className="sheet layout-roteiro"
      data-layout="roteiro"
      data-paginate="off"
      data-folio="off"
    >
      <div className="rt-page">
        <header className="rt-header">
          <div className="rt-heading">
            <span className="rt-number">{page.number}</span>
            <h1 className="rt-title">{page.axis}</h1>
          </div>
          <div className="rt-guest">
            <p className="rt-city">{page.city}</p>
            {page.guests.map((guest, index) => (
              <p className="rt-guest-line" key={index}>
                <strong className="rt-guest-name">{guest.name}</strong>
                <span className="rt-guest-role">{guest.role}</span>
              </p>
            ))}
          </div>
          <span className="rt-rule" aria-hidden="true" />
        </header>

        <div className="rt-body">
          <section className="rt-opening" aria-label="Abertura">
            <p className="rt-label">Abertura</p>
            <p className="rt-opening-text">{page.opening}</p>
          </section>

          <section className="rt-questions" aria-label="Perguntas">
            <p className="rt-label">Perguntas</p>
            <ol className="rt-question-list">
              {page.questions.map((question) => (
                <li className="rt-question" key={question.number}>
                  <span className="rt-question-num">{question.number}</span>
                  <div className="rt-question-body">
                    <p className="rt-question-text">{question.text}</p>
                    {question.followUp ? <FollowUp question={question} /> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <footer className="rt-footer">
          <ConsedLogo markOnly size={11} />
          <span className="rt-footer-rule" aria-hidden="true" />
        </footer>
      </div>
    </article>
  )
}

function FollowUp({ question }: { question: RoteiroQuestion }) {
  const followUp = question.followUp
  if (!followUp) return null
  return (
    <div className="rt-followup">
      <p className="rt-followup-label">{followUp.label}</p>
      <ul className="rt-followup-items">
        {followUp.items.map((item, index) => (
          <li key={index}>
            <span className="rt-followup-marker">{item.marker}</span>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
