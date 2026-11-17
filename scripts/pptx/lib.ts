import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export type DeckManifest = {
  id: string
  title: string
  subtitle: string
  source: string
  geometry: { cx: number; cy: number; widthIn: number; heightIn: number }
}

export type SlideRef = { number: number; file: string }

export type ShapeSummary = {
  id: string
  name: string
  type: string
  text: string
}

export type Edit = {
  id: string
  slide: number
  find: string
  replace: string
  comment?: number
  occurrence?: number
  status?: 'pendente' | 'ignorado'
}

export type EditOutcome =
  | { status: 'aplicado'; detail: string }
  | { status: 'nao-encontrado'; detail: string }
  | { status: 'spans-runs'; detail: string }
  | { status: 'ignorado'; detail: string }

export function deckPaths(manifest: DeckManifest) {
  const work = path.join(root, 'output', manifest.id, 'work')
  return {
    manifestFile: path.join(root, 'content', 'apresentacao', `${manifest.id}.json`),
    editsFile: path.join(root, 'content', 'apresentacao', `${manifest.id}.edits.json`),
    master: path.join(root, manifest.source),
    work,
    build: path.join(root, 'output', `${manifest.id}.pptx`),
    preview: path.join(root, 'output', manifest.id, 'previa'),
  }
}

export function readManifest(): DeckManifest {
  const file = path.join(root, 'content', 'apresentacao', 'formacao-ia.json')
  return JSON.parse(readFileSync(file, 'utf8')) as DeckManifest
}

export function readEdits(manifest: DeckManifest): Edit[] {
  const { editsFile } = deckPaths(manifest)
  if (!existsSync(editsFile)) return []
  const parsed = JSON.parse(readFileSync(editsFile, 'utf8')) as { edits?: Edit[] }
  return parsed.edits ?? []
}

/** Unpack the deck into a scratch directory. The master file is never touched. */
export function extract(manifest: DeckManifest) {
  const { master, work } = deckPaths(manifest)
  if (!existsSync(master)) {
    throw new Error(`Missing master deck: ${path.relative(root, master)}`)
  }
  rmSync(work, { recursive: true, force: true })
  mkdirSync(work, { recursive: true })
  run('unzip', ['-q', '-o', master, '-d', work])
  return work
}

/** Rebuild a pptx from the scratch directory. */
export function pack(work: string, output: string) {
  rmSync(output, { force: true })
  mkdirSync(path.dirname(output), { recursive: true })
  run('zip', ['-q', '-r', '-X', output, '.', '-x', '*.DS_Store', '-x', '__MACOSX/*'], {
    cwd: work,
  })
}

/** Slides in presentation order, resolved through the relationship ids. */
export function slideOrder(work: string): SlideRef[] {
  const presentation = readFileSync(path.join(work, 'ppt/presentation.xml'), 'utf8')
  const rels = readFileSync(path.join(work, 'ppt/_rels/presentation.xml.rels'), 'utf8')
  const targets = new Map<string, string>()
  for (const match of rels.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = attr(match[0], 'Id')
    const target = attr(match[0], 'Target')
    if (id && target) targets.set(id, target)
  }
  const slides: SlideRef[] = []
  const list = presentation.match(/<p:sldIdLst>([\s\S]*?)<\/p:sldIdLst>/)?.[1] ?? ''
  for (const match of list.matchAll(/<p:sldId\b[^>]*>/g)) {
    const rid = attr(match[0], 'r:id')
    const target = rid ? targets.get(rid) : undefined
    if (!target) continue
    const file = path.posix.normalize(path.posix.join('ppt', target))
    slides.push({ number: slides.length + 1, file })
  }
  return slides
}

export function slideFile(work: string, number: number): string {
  const slide = slideOrder(work).find((candidate) => candidate.number === number)
  if (!slide) throw new Error(`Slide ${number} does not exist in this deck`)
  return path.join(work, slide.file)
}

/** Slides marked hidden in PowerPoint never reach the printed preview. */
export function hiddenSlides(work: string): Set<number> {
  const hidden = new Set<number>()
  for (const slide of slideOrder(work)) {
    const xml = readFileSync(path.join(work, slide.file), 'utf8')
    if (/<p:sld\b[^>]*\bshow="0"/.test(xml)) hidden.add(slide.number)
  }
  return hidden
}

export function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, '&')
}

export function encodeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Every shape on a slide with its decoded text, in document order. */
export function shapes(xml: string): ShapeSummary[] {
  const found: ShapeSummary[] = []
  const blocks = [...xml.matchAll(/<p:(sp|pic|graphicFrame|grpSp)\b[^>]*>([\s\S]*?)<\/p:\1>/g)]
  for (const block of blocks) {
    const body = block[2]
    const cNvPr = body.match(/<p:cNvPr\b[^>]*>/)?.[0] ?? ''
    const texts = [...body.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => decodeXml(match[1]))
    found.push({
      id: attr(cNvPr, 'id') ?? '',
      name: attr(cNvPr, 'name') ?? '',
      type: block[1],
      text: texts.join('\n').trim(),
    })
  }
  return found
}

export function slideText(xml: string) {
  return [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
    .map((match) => decodeXml(match[1]))
    .join('\n')
}

type Run = {
  /** Offsets in the decoded text of the paragraph. */
  start: number
  end: number
  rPr: string
  /** Offsets of the raw characters inside <a:t>, in the slide xml. */
  rawStart: number
  rawEnd: number
}

/**
 * Rewrites text inside the slide XML without touching the shape tree.
 *
 * A match contained in a single run is replaced in place. A match that spans
 * runs is only merged when every run it touches carries the same formatting,
 * so we never flatten a mixed-format sentence by accident.
 */
export function replaceText(
  xml: string,
  find: string,
  replace: string,
  occurrence = 1,
): { xml: string; outcome: EditOutcome } {
  const paragraphs = [...xml.matchAll(/<a:p\b[^>]*>([\s\S]*?)<\/a:p>/g)]
  let seen = 0

  for (const paragraph of paragraphs) {
    const openTagEnd = paragraph[0].indexOf('>') + 1
    const bodyStart = (paragraph.index ?? 0) + openTagEnd
    const body = paragraph[1]
    const runs: Run[] = []
    let cursor = 0
    for (const run of body.matchAll(/<a:r\b[^>]*>([\s\S]*?)<\/a:r>/g)) {
      const inner = run[1]
      const t = inner.match(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/)
      if (!t) continue
      const text = decodeXml(t[1])
      const rPr = inner.match(/<a:rPr\b[^>]*\/>|<a:rPr\b[^>]*>[\s\S]*?<\/a:rPr>/)?.[0] ?? ''
      const innerOffset = inner.indexOf(t[0])
      const contentOffset = t[0].indexOf('>') + 1
      const rawStart =
        bodyStart + (run.index ?? 0) + run[0].indexOf('>') + 1 + innerOffset + contentOffset
      runs.push({
        start: cursor,
        end: cursor + text.length,
        rPr,
        rawStart,
        rawEnd: rawStart + t[1].length,
      })
      cursor += text.length
    }
    if (runs.length === 0) continue

    const joined = runs.map((run) => xml.slice(run.rawStart, run.rawEnd)).map(decodeXml).join('')
    let from = joined.indexOf(find)
    while (from >= 0) {
      seen += 1
      if (seen === occurrence) {
        const to = from + find.length
        const touched = runs.filter((run) => run.end > from && run.start < to)
        const single = touched.length === 1

        if (!single && new Set(touched.map((run) => run.rPr)).size > 1) {
          const pieces = touched.map((run) => joined.slice(run.start, run.end))
          return {
            xml,
            outcome: {
              status: 'spans-runs',
              detail: `"${find}" atravessa ${touched.length} trechos com formatação diferente: ${pieces
                .map((piece) => JSON.stringify(piece))
                .join(' + ')}. Divida a edição por trecho.`,
            },
          }
        }

        let next = xml
        // Walk backwards so earlier offsets stay valid after each splice.
        for (const run of [...touched].reverse()) {
          const localStart = Math.max(from, run.start) - run.start
          const localEnd = Math.min(to, run.end) - run.start
          const current = decodeXml(next.slice(run.rawStart, run.rawEnd))
          const isFirst = run === touched[0]
          const updated =
            current.slice(0, localStart) + (isFirst ? replace : '') + current.slice(localEnd)
          next =
            next.slice(0, run.rawStart) + encodeXml(updated) + next.slice(run.rawEnd)
        }

        return {
          xml: next,
          outcome: {
            status: 'aplicado',
            detail: single ? 'trecho único' : `${touched.length} trechos com a mesma formatação`,
          },
        }
      }
      from = joined.indexOf(find, from + find.length)
    }
  }

  return {
    xml,
    outcome: { status: 'nao-encontrado', detail: `"${find}" não aparece no slide` },
  }
}

/** sha256 of every part, so we can prove exactly which slides changed. */
export function fingerprint(dir: string) {
  const parts = new Map<string, string>()
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = path.join(current, entry)
      if (statSync(full).isDirectory()) {
        walk(full)
      } else {
        const relative = path.relative(dir, full).split(path.sep).join('/')
        parts.set(relative, createHash('sha256').update(readFileSync(full)).digest('hex'))
      }
    }
  }
  walk(dir)
  return parts
}

export function diffFingerprints(before: Map<string, string>, after: Map<string, string>) {
  const added: string[] = []
  const removed: string[] = []
  const changed: string[] = []
  for (const [file, hash] of after) {
    const previous = before.get(file)
    if (previous === undefined) added.push(file)
    else if (previous !== hash) changed.push(file)
  }
  for (const file of before.keys()) {
    if (!after.has(file)) removed.push(file)
  }
  return { added, removed, changed }
}

export function hasCommand(command: string) {
  return spawnSync('which', [command], { encoding: 'utf8' }).status === 0
}

export function run(
  command: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    env: options.env ?? process.env,
  })
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed\n${result.stderr || result.stdout}`)
  }
  return result.stdout
}

export function writeJson(file: string, value: unknown) {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function attr(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${name}="([^"]*)"`))
  return match?.[1]
}
