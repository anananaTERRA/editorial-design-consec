export type TextRun = {
  text: string
  bold?: boolean
  italic?: boolean
  href?: string
}

export type CompositionStrategy = 'flow' | 'workbook' | 'roteiro' | 'caso' | 'cronograma' | 'verso'
export type SectionLayout = 'standard' | 'workbook' | 'roteiro' | 'caso' | 'cronograma' | 'verso'

export type DocumentSection = {
  id: string
  strategy: CompositionStrategy
  layout: SectionLayout
  source: string
}

/** Running head used by documents that print their own masthead (e.g. the case studies). */
export type DocumentMasthead = {
  note: string
  footer: string
}

export type EditorialDocument = {
  id: string
  language: string
  title: string
  subtitle: string
  author: string
  masthead?: DocumentMasthead
  sections: DocumentSection[]
}

export type SectionFrontmatter = {
  kicker?: string
  sheetVariant?: string
  folio?: 'on' | 'off'
}

/* ---------- Workbook content model ---------- */

export type WorkbookHeader = {
  eyebrow: string
  title: string
  subtitle: string
  /** Show the "Grupo / Relator(a)" fill-in fields. */
  fields?: boolean
}

export type WorkbookRailStep = {
  kind: 'start' | 'step' | 'end'
  number?: string
  label?: string
  title: string
  time: string
  body: string
}

export type WorkbookRail = {
  intro: string[]
  steps: WorkbookRailStep[]
}

export type WorkbookOrientation = {
  number: string
  title: string
  time: string
  prompt: string
  hint?: string
  style: 'lines' | 'boxes'
}

export type WorkbookField = {
  title: string
  hint?: string
}

export type WorkbookPanel = {
  number: string
  title: string
  time: string
}

export type WorkbookCasePage = {
  variant: 'case'
  header: WorkbookHeader
  rail: WorkbookRail
  fields: WorkbookPanel & {
    left: WorkbookField
    right: WorkbookField
  }
  decision: WorkbookPanel & {
    paths: WorkbookField
    recommendation: WorkbookField
    questions?: {
      title: string
      categories: { title: string; questions: string[] }[]
    }
  }
  orientation: WorkbookOrientation
}

export type WorkbookProfilePage = {
  variant: 'profile'
  header: WorkbookHeader
  rail: WorkbookRail
  empathy: WorkbookPanel & {
    center: string
    zones: WorkbookField[]
  }
  training: WorkbookPanel & {
    fields: WorkbookField[]
  }
  orientation: WorkbookOrientation
}

export type WorkbookTrajectoryPage = {
  variant: 'trajectory'
  header: WorkbookHeader
  rail: WorkbookRail
  main: WorkbookPanel
  stages: string[]
  rows: WorkbookField[]
  orientation: WorkbookOrientation
}

export type WorkbookMatrixPage = {
  variant: 'matrix'
  header: WorkbookHeader
  rail: WorkbookRail
  matrix: WorkbookPanel & {
    note: string
    cells: WorkbookField[]
  }
  orientation: WorkbookOrientation
}

export type WorkbookProcessPage = {
  variant: 'process'
  header: WorkbookHeader
  rail: WorkbookRail
  main: WorkbookPanel
  processLabel: string
  columns: WorkbookField[]
  orientation: WorkbookOrientation
}

export type WorkbookPageContent =
  | WorkbookCasePage
  | WorkbookProfilePage
  | WorkbookTrajectoryPage
  | WorkbookMatrixPage
  | WorkbookProcessPage

/* ---------- Roteiro de conversa content model ---------- */

export type RoteiroGuest = {
  name: string
  role: string
}

export type RoteiroFollowUpItem = {
  marker: string
  text: string
}

export type RoteiroQuestion = {
  number: string
  text: string
  followUp?: {
    label: string
    items: RoteiroFollowUpItem[]
  }
}

export type RoteiroPageContent = {
  variant: 'roteiro'
  number: string
  axis: string
  city: string
  guests: RoteiroGuest[]
  opening: string
  questions: RoteiroQuestion[]
}

/* ---------- Estudo de caso content model ---------- */

export type CasoSection = {
  title: string
  paragraphs: string[]
}

export type CasoPageContent = {
  variant: 'caso'
  /** Case label as printed: "1A", "1B", "5A", "5B". */
  number: string
  /** Thematic axis: "Governança", "Infraestrutura e segurança da informação". */
  axis: string
  /** Territory name used as the page title: "Capital A". */
  title: string
  descriptor: string
  lead: string[]
  sections: CasoSection[]
  decision: string
}

/* ---------- Cronograma (fichas A5 de programação) ---------- */

export type CronogramaKind =
  | 'abertura'
  | 'mesa'
  | 'oficina'
  | 'pausa'
  | 'encerramento'
  | 'sessao'

export type CronogramaItem = {
  /** Leading name or label, printed in semibold: speaker, city, etc. */
  strong?: string
  text: string
}

export type CronogramaEntry = {
  start: string
  end: string
  /** Duration in minutes, as printed in the source plan. */
  duration: string
  kind: CronogramaKind
  /** Small uppercase label printed beside the title: "Mesa 1", "Oficina 3.1". */
  label?: string
  /** Dynamic printed with the label: "Jornada do usuário", "Mapa da empatia". */
  method?: string
  title: string
  subtitle?: string
  description?: string
  /** Paragraph printed between the description and the list of steps. */
  intro?: string
  items?: CronogramaItem[]
  paragraphs?: string[]
  /** Quem conduz. */
  host?: string
  /** Observações. */
  note?: string
}

export type CronogramaPageContent = {
  variant: 'cronograma'
  /** Day number printed in the circle: "1", "2". */
  day: string
  /** Part of the day printed as the title: "MANHÃ", "TARDE". */
  part: string
  weekday: string
  date: string
  entries: CronogramaEntry[]
}

/* ---------- Verso (página roxa de fechamento) ---------- */

export type VersoPageContent = {
  variant: 'verso'
}
