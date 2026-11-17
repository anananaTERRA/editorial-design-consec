import type {
  CasoPageContent,
  CasoSection,
  CompositionStrategy,
  CronogramaEntry,
  CronogramaItem,
  CronogramaPageContent,
  CronogramaSlot,
  DocumentMasthead,
  DocumentSection,
  EditorialDocument,
  RoteiroPageContent,
  RoteiroQuestion,
  SectionLayout,
  VersoPageContent,
  WorkbookField,
  WorkbookHeader,
  WorkbookOrientation,
  WorkbookPageContent,
  WorkbookPanel,
  WorkbookRail,
  WorkbookRailStep,
} from './types'

const idPattern = /^[a-z][a-z0-9-]*$/
const layoutForStrategy: Record<CompositionStrategy, SectionLayout> = {
  flow: 'standard',
  workbook: 'workbook',
  roteiro: 'roteiro',
  caso: 'caso',
  cronograma: 'cronograma',
  verso: 'verso',
}
const sourcePrefix: Record<CompositionStrategy, string> = {
  flow: 'chapters/',
  workbook: 'workbook/',
  roteiro: 'roteiros/',
  caso: 'casos/',
  cronograma: 'cronograma/',
  verso: 'verso/',
}
const sourceExtension: Record<CompositionStrategy, string> = {
  flow: '.mdx',
  workbook: '.json',
  roteiro: '.json',
  caso: '.json',
  cronograma: '.json',
  verso: '.json',
}

export class ContentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContentError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ContentError(`${label} must be a non-empty string`)
  }
  return value.trim()
}

function optionalString(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined
  return requireString(value, label)
}

function requireArray(value: unknown, label: string, min = 1): unknown[] {
  if (!Array.isArray(value) || value.length < min) {
    throw new ContentError(`${label} must be an array with at least ${min} item(s)`)
  }
  return value
}

function requireId(value: unknown, label: string, seen: Set<string>): string {
  const id = requireString(value, label)
  if (!idPattern.test(id)) {
    throw new ContentError(`${label} must be a lowercase slug (letters, numbers, hyphens)`)
  }
  if (seen.has(id)) {
    throw new ContentError(`${label} duplicates "${id}"`)
  }
  seen.add(id)
  return id
}

export function parseDocument(value: unknown): EditorialDocument {
  if (!isRecord(value)) {
    throw new ContentError('document must be an object')
  }

  const id = requireId(value.id, 'id', new Set())
  const language = requireString(value.language, 'language')
  if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(language)) {
    throw new ContentError('language must be a BCP 47 tag such as "pt-BR"')
  }

  const title = requireString(value.title, 'title')
  const subtitle = requireString(value.subtitle, 'subtitle')
  const author = requireString(value.author, 'author')

  if (!Array.isArray(value.sections) || value.sections.length === 0) {
    throw new ContentError('sections must be a non-empty array')
  }

  const masthead = parseMasthead(value.masthead)

  const seenIds = new Set<string>()
  const seenSources = new Set<string>()
  const sections = value.sections.map((section, index): DocumentSection => {
    const label = `sections[${index}]`
    if (!isRecord(section)) {
      throw new ContentError(`${label} must be an object`)
    }
    const sectionId = requireId(section.id, `${label}.id`, seenIds)
    const strategy = section.strategy
    if (
      strategy !== 'flow' &&
      strategy !== 'workbook' &&
      strategy !== 'roteiro' &&
      strategy !== 'caso' &&
      strategy !== 'cronograma' &&
      strategy !== 'verso'
    ) {
      throw new ContentError(
        `${label}.strategy must be flow, workbook, roteiro, caso, cronograma, or verso`,
      )
    }
    const expectedLayout = layoutForStrategy[strategy]
    if (section.layout !== expectedLayout) {
      throw new ContentError(`${label}.layout must be "${expectedLayout}" for strategy "${strategy}"`)
    }
    const source = requireString(section.source, `${label}.source`)
    const prefix = sourcePrefix[strategy]
    const extension = sourceExtension[strategy]
    if (!source.startsWith(prefix) || !source.endsWith(extension) || source.includes('..')) {
      throw new ContentError(
        `${label}.source must look like "${prefix}<slug>${extension}" and stay one folder deep`,
      )
    }
    if (seenSources.has(source)) {
      throw new ContentError(`${label}.source duplicates "${source}"`)
    }
    seenSources.add(source)
    return { id: sectionId, strategy, layout: expectedLayout, source }
  })

  return { id, language, title, subtitle, author, ...(masthead ? { masthead } : {}), sections }
}

function parseMasthead(value: unknown): DocumentMasthead | undefined {
  if (value === undefined) return undefined
  if (!isRecord(value)) throw new ContentError('masthead must be an object')
  return {
    note: requireString(value.note, 'masthead.note'),
    footer: requireString(value.footer, 'masthead.footer'),
  }
}

function parseHeader(value: unknown, label: string): WorkbookHeader {
  if (!isRecord(value)) throw new ContentError(`${label} must be an object`)
  const fields = value.fields
  if (fields !== undefined && typeof fields !== 'boolean') {
    throw new ContentError(`${label}.fields must be a boolean`)
  }
  return {
    eyebrow: requireString(value.eyebrow, `${label}.eyebrow`),
    title: requireString(value.title, `${label}.title`),
    subtitle: requireString(value.subtitle, `${label}.subtitle`),
    ...(fields === true ? { fields: true } : {}),
  }
}

function parseRail(value: unknown, label: string): WorkbookRail {
  if (!isRecord(value)) throw new ContentError(`${label} must be an object`)
  const intro = requireArray(value.intro, `${label}.intro`).map((item, index) =>
    requireString(item, `${label}.intro[${index}]`),
  )
  const steps = requireArray(value.steps, `${label}.steps`).map(
    (item, index): WorkbookRailStep => {
      const stepLabel = `${label}.steps[${index}]`
      if (!isRecord(item)) throw new ContentError(`${stepLabel} must be an object`)
      const kind = item.kind
      if (kind !== 'start' && kind !== 'step' && kind !== 'end') {
        throw new ContentError(`${stepLabel}.kind must be start, step, or end`)
      }
      return {
        kind,
        ...(kind === 'step'
          ? { number: requireString(item.number, `${stepLabel}.number`) }
          : { label: requireString(item.label, `${stepLabel}.label`) }),
        title: requireString(item.title, `${stepLabel}.title`),
        time: requireString(item.time, `${stepLabel}.time`),
        body: requireString(item.body, `${stepLabel}.body`),
      }
    },
  )
  return { intro, steps }
}

function parsePanel(value: unknown, label: string): WorkbookPanel {
  if (!isRecord(value)) throw new ContentError(`${label} must be an object`)
  return {
    number: requireString(value.number, `${label}.number`),
    title: requireString(value.title, `${label}.title`),
    time: requireString(value.time, `${label}.time`),
  }
}

function parseField(value: unknown, label: string): WorkbookField {
  if (!isRecord(value)) throw new ContentError(`${label} must be an object`)
  return {
    title: requireString(value.title, `${label}.title`),
    ...(optionalString(value.hint, `${label}.hint`)
      ? { hint: optionalString(value.hint, `${label}.hint`) }
      : {}),
  }
}

function parseOrientation(value: unknown, label: string): WorkbookOrientation {
  if (!isRecord(value)) throw new ContentError(`${label} must be an object`)
  const style = value.style
  if (style !== 'lines' && style !== 'boxes') {
    throw new ContentError(`${label}.style must be lines or boxes`)
  }
  return {
    number: requireString(value.number, `${label}.number`),
    title: requireString(value.title, `${label}.title`),
    time: requireString(value.time, `${label}.time`),
    prompt: requireString(value.prompt, `${label}.prompt`),
    ...(optionalString(value.hint, `${label}.hint`)
      ? { hint: optionalString(value.hint, `${label}.hint`) }
      : {}),
    style,
  }
}

export function parseWorkbookPage(value: unknown, source = 'workbook'): WorkbookPageContent {
  if (!isRecord(value)) throw new ContentError(`${source} must be an object`)
  const header = parseHeader(value.header, `${source}.header`)
  const rail = parseRail(value.rail, `${source}.rail`)
  const orientation = parseOrientation(value.orientation, `${source}.orientation`)
  const variant = value.variant

  if (variant === 'case') {
    if (!isRecord(value.fields) || !isRecord(value.decision)) {
      throw new ContentError(`${source} case needs fields and decision objects`)
    }
    const decision = value.decision
    const questions = isRecord(decision.questions)
      ? {
          title: requireString(decision.questions.title, `${source}.decision.questions.title`),
          categories: requireArray(
            decision.questions.categories,
            `${source}.decision.questions.categories`,
          ).map((item, index) => {
            const label = `${source}.decision.questions.categories[${index}]`
            if (!isRecord(item)) throw new ContentError(`${label} must be an object`)
            return {
              title: requireString(item.title, `${label}.title`),
              questions: requireArray(item.questions, `${label}.questions`).map((question, qIndex) =>
                requireString(question, `${label}.questions[${qIndex}]`),
              ),
            }
          }),
        }
      : undefined
    return {
      variant,
      header,
      rail,
      fields: {
        ...parsePanel(value.fields, `${source}.fields`),
        left: parseField(value.fields.left, `${source}.fields.left`),
        right: parseField(value.fields.right, `${source}.fields.right`),
      },
      decision: {
        ...parsePanel(decision, `${source}.decision`),
        paths: parseField(decision.paths, `${source}.decision.paths`),
        recommendation: parseField(decision.recommendation, `${source}.decision.recommendation`),
        ...(questions ? { questions } : {}),
      },
      orientation,
    }
  }

  if (variant === 'profile') {
    if (!isRecord(value.empathy) || !isRecord(value.training)) {
      throw new ContentError(`${source} profile needs empathy and training objects`)
    }
    const zones = requireArray(value.empathy.zones, `${source}.empathy.zones`, 6).map(
      (item, index) => parseField(item, `${source}.empathy.zones[${index}]`),
    )
    if (zones.length !== 6) {
      throw new ContentError(`${source}.empathy.zones must contain exactly 6 zones`)
    }
    const fields = requireArray(value.training.fields, `${source}.training.fields`, 2).map(
      (item, index) => parseField(item, `${source}.training.fields[${index}]`),
    )
    return {
      variant,
      header,
      rail,
      empathy: {
        ...parsePanel(value.empathy, `${source}.empathy`),
        center: requireString(value.empathy.center, `${source}.empathy.center`),
        zones,
      },
      training: {
        ...parsePanel(value.training, `${source}.training`),
        fields,
      },
      orientation,
    }
  }

  if (variant === 'trajectory') {
    const stages = requireArray(value.stages, `${source}.stages`, 3).map((item, index) =>
      requireString(item, `${source}.stages[${index}]`),
    )
    const rows = requireArray(value.rows, `${source}.rows`, 3).map((item, index) =>
      parseField(item, `${source}.rows[${index}]`),
    )
    if (stages.length !== 3 || rows.length !== 3) {
      throw new ContentError(`${source} trajectory needs exactly 3 stages and 3 rows`)
    }
    return {
      variant,
      header,
      rail,
      main: parsePanel(value.main, `${source}.main`),
      stages,
      rows,
      orientation,
    }
  }

  if (variant === 'matrix') {
    if (!isRecord(value.matrix)) throw new ContentError(`${source}.matrix must be an object`)
    const cells = requireArray(value.matrix.cells, `${source}.matrix.cells`, 3).map(
      (item, index) => parseField(item, `${source}.matrix.cells[${index}]`),
    )
    if (cells.length !== 3) {
      throw new ContentError(`${source}.matrix.cells must contain exactly 3 cells`)
    }
    return {
      variant,
      header,
      rail,
      matrix: {
        ...parsePanel(value.matrix, `${source}.matrix`),
        note: requireString(value.matrix.note, `${source}.matrix.note`),
        cells,
      },
      orientation,
    }
  }

  if (variant === 'process') {
    const columns = requireArray(value.columns, `${source}.columns`, 3).map((item, index) =>
      parseField(item, `${source}.columns[${index}]`),
    )
    if (columns.length !== 3) {
      throw new ContentError(`${source}.columns must contain exactly 3 columns`)
    }
    return {
      variant,
      header,
      rail,
      main: parsePanel(value.main, `${source}.main`),
      processLabel: requireString(value.processLabel, `${source}.processLabel`),
      columns,
      orientation,
    }
  }

  throw new ContentError(`${source}.variant must be case, profile, trajectory, matrix, or process`)
}

export function parseRoteiroPage(value: unknown, source = 'roteiro'): RoteiroPageContent {
  if (!isRecord(value)) throw new ContentError(`${source} must be an object`)
  if (value.variant !== 'roteiro') {
    throw new ContentError(`${source}.variant must be roteiro`)
  }
  const guests = requireArray(value.guests, `${source}.guests`).map((item, index) => {
    const label = `${source}.guests[${index}]`
    if (!isRecord(item)) throw new ContentError(`${label} must be an object`)
    return {
      name: requireString(item.name, `${label}.name`),
      role: requireString(item.role, `${label}.role`),
    }
  })
  const questions = requireArray(value.questions, `${source}.questions`).map(
    (item, index): RoteiroQuestion => {
      const label = `${source}.questions[${index}]`
      if (!isRecord(item)) throw new ContentError(`${label} must be an object`)
      return {
        number: requireString(item.number, `${label}.number`),
        text: requireString(item.text, `${label}.text`),
        ...(item.followUp === undefined
          ? {}
          : { followUp: parseRoteiroFollowUp(item.followUp, `${label}.followUp`) }),
      }
    },
  )
  return {
    variant: 'roteiro',
    number: requireString(value.number, `${source}.number`),
    axis: requireString(value.axis, `${source}.axis`),
    city: requireString(value.city, `${source}.city`),
    guests,
    opening: requireString(value.opening, `${source}.opening`),
    questions,
  }
}

function parseRoteiroFollowUp(
  value: unknown,
  label: string,
): NonNullable<RoteiroQuestion['followUp']> {
  if (!isRecord(value)) throw new ContentError(`${label} must be an object`)
  return {
    label: requireString(value.label, `${label}.label`),
    items: requireArray(value.items, `${label}.items`).map((entry, index) => {
      const itemLabel = `${label}.items[${index}]`
      if (!isRecord(entry)) throw new ContentError(`${itemLabel} must be an object`)
      return {
        marker: requireString(entry.marker, `${itemLabel}.marker`),
        text: requireString(entry.text, `${itemLabel}.text`),
      }
    }),
  }
}

export function parseCasoPage(value: unknown, source = 'caso'): CasoPageContent {
  if (!isRecord(value)) throw new ContentError(`${source} must be an object`)
  if (value.variant !== 'caso') {
    throw new ContentError(`${source}.variant must be caso`)
  }
  const lead = requireArray(value.lead, `${source}.lead`).map((item, index) =>
    requireString(item, `${source}.lead[${index}]`),
  )
  const sections = requireArray(value.sections, `${source}.sections`).map(
    (item, index): CasoSection => {
      const label = `${source}.sections[${index}]`
      if (!isRecord(item)) throw new ContentError(`${label} must be an object`)
      return {
        title: requireString(item.title, `${label}.title`),
        paragraphs: requireArray(item.paragraphs, `${label}.paragraphs`).map(
          (paragraph, paragraphIndex) =>
            requireString(paragraph, `${label}.paragraphs[${paragraphIndex}]`),
        ),
      }
    },
  )
  return {
    variant: 'caso',
    number: requireString(value.number, `${source}.number`),
    axis: requireString(value.axis, `${source}.axis`),
    title: requireString(value.title, `${source}.title`),
    descriptor: requireString(value.descriptor, `${source}.descriptor`),
    lead,
    sections,
    decision: requireString(value.decision, `${source}.decision`),
  }
}

export function parseCronogramaPage(
  value: unknown,
  source = 'cronograma',
): CronogramaPageContent {
  if (!isRecord(value)) throw new ContentError(`${source} must be an object`)
  if (value.variant !== 'cronograma') {
    throw new ContentError(`${source}.variant must be cronograma`)
  }
  const entries = requireArray(value.entries, `${source}.entries`).map(
    (item, index): CronogramaEntry => {
      const label = `${source}.entries[${index}]`
      if (!isRecord(item)) throw new ContentError(`${label} must be an object`)
      if (item.kind === 'mc') {
        return {
          kind: 'mc',
          text: requireString(item.text, `${label}.text`),
        }
      }
      return parseCronogramaSlot(item, label)
    },
  )

  return {
    variant: 'cronograma',
    day: requireString(value.day, `${source}.day`),
    part: requireString(value.part, `${source}.part`),
    weekday: requireString(value.weekday, `${source}.weekday`),
    date: requireString(value.date, `${source}.date`),
    entries,
  }
}

function parseCronogramaSlot(item: Record<string, unknown>, label: string): CronogramaSlot {
  const kind = item.kind
  if (
    kind !== 'abertura' &&
    kind !== 'mesa' &&
    kind !== 'oficina' &&
    kind !== 'pausa' &&
    kind !== 'encerramento' &&
    kind !== 'sessao'
  ) {
    throw new ContentError(
      `${label}.kind must be abertura, mesa, oficina, pausa, encerramento, or sessao`,
    )
  }
  const duration = requireString(item.duration, `${label}.duration`)
  if (!/^\d+$/.test(duration)) {
    throw new ContentError(`${label}.duration must be a number of minutes`)
  }
  const items =
    item.items === undefined
      ? undefined
      : parseCronogramaItems(item.items, `${label}.items`)
  const paragraphs =
    item.paragraphs === undefined
      ? undefined
      : requireArray(item.paragraphs, `${label}.paragraphs`).map((paragraph, pIndex) =>
          requireString(paragraph, `${label}.paragraphs[${pIndex}]`),
        )
  if (item.tone !== undefined && item.tone !== 'mc') {
    throw new ContentError(`${label}.tone must be "mc" when present`)
  }
  return {
    start: parseCronogramaTime(item.start, `${label}.start`),
    end: parseCronogramaTime(item.end, `${label}.end`),
    duration,
    kind,
    title: requireString(item.title, `${label}.title`),
    ...(optionalString(item.label, `${label}.label`)
      ? { label: optionalString(item.label, `${label}.label`) }
      : {}),
    ...(optionalString(item.method, `${label}.method`)
      ? { method: optionalString(item.method, `${label}.method`) }
      : {}),
    ...(optionalString(item.subtitle, `${label}.subtitle`)
      ? { subtitle: optionalString(item.subtitle, `${label}.subtitle`) }
      : {}),
    ...(optionalString(item.description, `${label}.description`)
      ? { description: optionalString(item.description, `${label}.description`) }
      : {}),
    ...(optionalString(item.intro, `${label}.intro`)
      ? { intro: optionalString(item.intro, `${label}.intro`) }
      : {}),
    ...(items ? { items } : {}),
    ...(paragraphs ? { paragraphs } : {}),
    ...(optionalString(item.host, `${label}.host`)
      ? { host: optionalString(item.host, `${label}.host`) }
      : {}),
    ...(optionalString(item.supplies, `${label}.supplies`)
      ? { supplies: optionalString(item.supplies, `${label}.supplies`) }
      : {}),
    ...(optionalString(item.note, `${label}.note`)
      ? { note: optionalString(item.note, `${label}.note`) }
      : {}),
    ...(item.tone === 'mc' ? { tone: 'mc' as const } : {}),
  }
}

function parseCronogramaTime(value: unknown, label: string): string {
  const time = requireString(value, label)
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new ContentError(`${label} must look like "08:30"`)
  }
  return time
}

function parseCronogramaItems(value: unknown, label: string): CronogramaItem[] {
  return requireArray(value, label).map((item, index) => {
    const itemLabel = `${label}[${index}]`
    if (!isRecord(item)) throw new ContentError(`${itemLabel} must be an object`)
    return {
      text: requireString(item.text, `${itemLabel}.text`),
      ...(optionalString(item.strong, `${itemLabel}.strong`)
        ? { strong: optionalString(item.strong, `${itemLabel}.strong`) }
        : {}),
    }
  })
}

export function parseVersoPage(value: unknown, source = 'verso'): VersoPageContent {
  if (!isRecord(value)) throw new ContentError(`${source} must be an object`)
  if (value.variant !== 'verso') {
    throw new ContentError(`${source}.variant must be verso`)
  }
  return { variant: 'verso' }
}
