import { Fragment, type ReactNode } from 'react'
import type {
  WorkbookCasePage,
  WorkbookField,
  WorkbookHeader,
  WorkbookMatrixPage,
  WorkbookOrientation,
  WorkbookPageContent,
  WorkbookPanel,
  WorkbookProfilePage,
  WorkbookProcessPage,
  WorkbookRail,
  WorkbookTrajectoryPage,
} from '../content/types'
import { ConsedLogo } from '../components/ConsedLogo'

type WorkbookPageProps = {
  id: string
  page: WorkbookPageContent
}

export function WorkbookPage({ id, page }: WorkbookPageProps) {
  return (
    <article
      id={id}
      className={`sheet layout-workbook wb-variant-${page.variant}`}
      data-layout="workbook"
      data-paginate="off"
      data-folio="off"
    >
      <div className="wb-page">
        <WorkbookHeaderView header={page.header} />
        <div className="wb-body">
          <WorkbookRailView rail={page.rail} />
          <main className="wb-main">
            <WorkbookBody page={page} />
          </main>
        </div>
        <WorkbookFooter />
      </div>
    </article>
  )
}

function WorkbookHeaderView({ header }: { header: WorkbookHeader }) {
  return (
    <header className="wb-header">
      <p className="wb-eyebrow">{header.eyebrow}</p>
      <div className="wb-header-title-row">
        <div className="wb-header-copy">
          <h1 className="wb-title">{header.title}</h1>
          <p className="wb-subtitle">{header.subtitle}</p>
        </div>
        {header.fields ? (
          <div className="wb-group-fields" aria-hidden="true">
            <span className="wb-group-label">Grupo</span>
            <span className="wb-group-line" />
            <span className="wb-group-label">Relator(a)</span>
            <span className="wb-group-line wb-group-line--wide" />
          </div>
        ) : null}
      </div>
    </header>
  )
}

function renderRailIntro(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((part, index) =>
    part.startsWith('*') && part.endsWith('*') && part.length > 2 ? (
      <em className="wb-rail-em" key={index}>
        {part.slice(1, -1)}
      </em>
    ) : (
      part
    ),
  )
}

function WorkbookRailView({ rail }: { rail: WorkbookRail }) {
  return (
    <aside className="wb-rail">
      <h2 className="wb-rail-title">Passo a passo</h2>
      {rail.intro.map((paragraph, index) => (
        <p className="wb-rail-intro" key={index}>
          {renderRailIntro(paragraph)}
        </p>
      ))}
      <div className="wb-rail-steps">
        {rail.steps.map((step, index) => (
          <div className={`wb-rail-step wb-rail-step--${step.kind}`} key={index}>
            <div className="wb-rail-step-head">
              {step.kind === 'step' ? (
                <span className="wb-step-num" data-step={step.number}>
                  {step.number}
                </span>
              ) : (
                <span className={`wb-pill wb-pill--${step.kind}`}>{step.label}</span>
              )}
              <strong>{step.title}</strong>
              <span className="wb-time">{step.time}</span>
            </div>
            <p className="wb-rail-step-body">{step.body}</p>
          </div>
        ))}
      </div>
    </aside>
  )
}

function WorkbookFooter() {
  return (
    <footer className="wb-footer">
      <ConsedLogo markOnly size={11} />
      <span className="wb-footer-rule" aria-hidden="true" />
    </footer>
  )
}

function WorkbookBody({ page }: { page: WorkbookPageContent }) {
  if (page.variant === 'case') return <CaseBody page={page} />
  if (page.variant === 'profile') return <ProfileBody page={page} />
  if (page.variant === 'trajectory') return <TrajectoryBody page={page} />
  if (page.variant === 'matrix') return <MatrixBody page={page} />
  return <ProcessBody page={page} />
}

function Panel({
  panel,
  className,
  children,
}: {
  panel: WorkbookPanel
  className?: string
  children: ReactNode
}) {
  return (
    <section className={`wb-panel ${className ?? ''}`.trim()} data-step={panel.number}>
      <header className="wb-panel-head">
        <span className="wb-panel-num" data-step={panel.number}>
          {panel.number}
        </span>
        <h2 className="wb-panel-title">{panel.title}</h2>
        <span className="wb-panel-time">{panel.time}</span>
      </header>
      <div className="wb-panel-body">{children}</div>
    </section>
  )
}

function FieldBox({ field, className }: { field: WorkbookField; className?: string }) {
  return (
    <div className={`wb-field ${className ?? ''}`.trim()}>
      <p className="wb-field-title">{field.title}</p>
      {field.hint ? <p className="wb-field-hint">{field.hint}</p> : null}
      <div className="wb-field-space" aria-hidden="true" />
    </div>
  )
}

function CaseBody({ page }: { page: WorkbookCasePage }) {
  return (
    <div className="wb-case">
      <Panel panel={page.fields} className="wb-panel--case-fields">
        <div className="wb-field-grid wb-field-grid--2">
          <FieldBox field={page.fields.left} />
          <FieldBox field={page.fields.right} />
        </div>
      </Panel>

      <Panel panel={page.decision} className="wb-panel--case-decision">
        <div className="wb-decision">
          <FieldBox field={page.decision.paths} />
          <FieldBox field={page.decision.recommendation} />
          <div className="wb-questions">
            <p className="wb-questions-title">{page.decision.questions.title}</p>
            {page.decision.questions.categories.map((category, index) => (
              <div className="wb-question" key={index}>
                <p className="wb-question-cat">{category.title}</p>
                {category.questions.map((question, qIndex) => (
                  <p className="wb-question-line" key={qIndex}>
                    {question}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <OrientationPanel orientation={page.orientation} />
    </div>
  )
}

function ProfileBody({ page }: { page: WorkbookProfilePage }) {
  const [primary, ...secondary] = page.training.fields
  const upperZones = page.empathy.zones.slice(0, 4)
  const lowerZones = page.empathy.zones.slice(4)
  return (
    <div className="wb-profile">
      <Panel panel={page.empathy} className="wb-panel--empathy">
        <div className="wb-empathy">
          <div className="wb-empathy-top">
            {upperZones.map((zone, index) => (
              <div className={`wb-empathy-zone wb-empathy-zone--${index + 1}`} key={index}>
                <p className="wb-zone-title">{zone.title}</p>
                {zone.hint ? <p className="wb-zone-hint">{zone.hint}</p> : null}
              </div>
            ))}
            <div className="wb-empathy-center">{page.empathy.center}</div>
          </div>
          <div className="wb-empathy-bottom">
            {lowerZones.map((zone, index) => (
              <div className={`wb-empathy-zone wb-empathy-zone--${index + 5}`} key={index}>
                <p className="wb-zone-title">{zone.title}</p>
                {zone.hint ? <p className="wb-zone-hint">{zone.hint}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <div className="wb-profile-bottom">
        <Panel panel={page.training} className="wb-panel--training">
          <div className="wb-training">
            {primary ? <FieldBox field={primary} className="wb-training-main" /> : null}
            <div className="wb-training-side">
              {secondary.map((field, index) => (
                <div className="wb-inline-field" key={index}>
                  <p className="wb-field-title">{field.title}</p>
                  {field.hint ? <p className="wb-field-hint">{field.hint}</p> : null}
                  <span className="wb-dash" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
        </Panel>
        <OrientationPanel orientation={page.orientation} className="wb-panel--orientation-side" />
      </div>
    </div>
  )
}

function TrajectoryBody({ page }: { page: WorkbookTrajectoryPage }) {
  return (
    <div className="wb-trajectory-page">
      <Panel panel={page.main} className="wb-panel--trajectory">
        <div className="wb-traj" style={{ gridTemplateRows: `auto repeat(${page.rows.length}, 1fr)` }}>
          <div className="wb-traj-corner" />
          {page.stages.map((stage, index) => (
            <div className="wb-traj-stage" key={index}>
              <span className="wb-traj-stage-num">{index + 1}</span>
              {stage}
            </div>
          ))}
          {page.rows.map((row, rowIndex) => (
            <Fragment key={rowIndex}>
              <div className="wb-traj-label">
                <p className="wb-field-title">{row.title}</p>
                {row.hint ? <p className="wb-field-hint">{row.hint}</p> : null}
              </div>
              {page.stages.map((_, stageIndex) => (
                <div className="wb-traj-cell" key={stageIndex} />
              ))}
            </Fragment>
          ))}
        </div>
      </Panel>
      <OrientationPanel orientation={page.orientation} />
    </div>
  )
}

function MatrixBody({ page }: { page: WorkbookMatrixPage }) {
  const [encourage, limit, prohibit] = page.matrix.cells
  return (
    <div className="wb-matrix-page">
      <Panel panel={page.matrix} className="wb-panel--matrix">
        <div className="wb-matrix-wrap">
          <div className="wb-axis-y" aria-hidden="true">
            <span>Ajuda muito</span>
            <span>Ajuda pouco</span>
          </div>
          <div className="wb-matrix">
            <div className="wb-matrix-cell">
              <p className="wb-cell-title">{encourage.title}</p>
              {encourage.hint ? <p className="wb-cell-hint">{encourage.hint}</p> : null}
            </div>
            <div className="wb-matrix-cell">
              <p className="wb-cell-title">{limit?.title}</p>
              {limit?.hint ? <p className="wb-cell-hint">{limit.hint}</p> : null}
            </div>
            <div className="wb-matrix-note">{page.matrix.note}</div>
            <div className="wb-matrix-cell">
              <p className="wb-cell-title">{prohibit?.title}</p>
              {prohibit?.hint ? <p className="wb-cell-hint">{prohibit.hint}</p> : null}
            </div>
          </div>
        </div>
        <div className="wb-axis-x" aria-hidden="true">
          <span>Exige pouco cuidado</span>
          <span>Exige muito cuidado</span>
        </div>
      </Panel>
      <OrientationPanel orientation={page.orientation} className="wb-panel--orientation-side" />
    </div>
  )
}

function ProcessBody({ page }: { page: WorkbookProcessPage }) {
  return (
    <div className="wb-process-page">
      <Panel panel={page.main} className="wb-panel--process">
        <p className="wb-process-label">
          <strong>{page.processLabel}</strong>
          <span className="wb-process-line" aria-hidden="true" />
        </p>
        <div className="wb-process-columns">
          {page.columns.map((column, index) => (
            <FieldBox field={column} key={index} />
          ))}
        </div>
      </Panel>
      <OrientationPanel orientation={page.orientation} />
    </div>
  )
}

function OrientationPanel({
  orientation,
  className,
}: {
  orientation: WorkbookOrientation
  className?: string
}) {
  return (
    <Panel panel={orientation} className={`wb-panel--orientation ${className ?? ''}`.trim()}>
      <p className="wb-orientation-prompt">
        {orientation.prompt}
        {orientation.hint ? <span className="wb-orientation-hint"> {orientation.hint}</span> : null}
      </p>
      {orientation.style === 'boxes' ? (
        <div className="wb-answer-boxes">
          {[1, 2, 3].map((number) => (
            <div className="wb-answer-box" key={number}>
              <span className="wb-answer-num">{number}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="wb-answer-lines">
          {[1, 2, 3].map((number) => (
            <div className="wb-answer-line" key={number}>
              <span className="wb-answer-num">{number}</span>
              <span className="wb-dash" aria-hidden="true" />
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}
