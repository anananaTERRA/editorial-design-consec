import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  ContentError,
  parseCasoPage,
  parseDocument,
  parseRoteiroPage,
  parseVersoPage,
  parseWorkbookPage,
} from '../src/content/schema'
import { assertDesignTokens, assertLength, readCustomProperty, readText } from './design-tokens'

const root = process.cwd()
const contentDir = path.join(root, 'content')
const errors: string[] = []

const allowedComponents = new Set([
  'Columns',
  'EditorialTable',
  'Figure',
  'Heading',
  'HighlightBox',
  'PullQuote',
])

function fail(message: string) {
  errors.push(message)
}

function guard(run: () => void) {
  try {
    run()
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error))
  }
}

const manifestFiles = [
  'document.json',
  'document-experiencias.json',
  'document-casos.json',
].map((name) => path.join(contentDir, name))
const documents = manifestFiles.map((file) => {
  const manifest = readJson(file)
  return manifest === undefined
    ? undefined
    : guardValue(() => parseDocument(manifest))
})

guard(() => {
  const tokensFile = 'src/styles/tokens.css'
  const tokens = readText(path.join(root, tokensFile))
  assertDesignTokens(tokens, tokensFile)

  for (const name of [
    '--page-width',
    '--page-height',
    '--margin-top',
    '--margin-bottom',
    '--margin-inner',
    '--margin-outer',
    '--bleed',
  ]) {
    assertLength(readCustomProperty(tokens, name, tokensFile), tokensFile, name)
  }

  const width = assertLength(readCustomProperty(tokens, '--page-width', tokensFile), tokensFile, '--page-width')
  const height = assertLength(readCustomProperty(tokens, '--page-height', tokensFile), tokensFile, '--page-height')
  if (width !== '297mm' || height !== '210mm') {
    throw new Error(`${tokensFile} must keep A4 landscape (297mm × 210mm); got ${width} × ${height}`)
  }

  const digitalFile = 'src/styles/digital.css'
  const digital = readText(path.join(root, digitalFile))
  if (readCustomProperty(digital, '--bleed', digitalFile).replace(/\s+/g, '') !== '0mm') {
    throw new Error(`${digitalFile} must set --bleed to 0mm`)
  }

  const printFile = 'src/styles/print.css'
  const printCss = readText(path.join(root, printFile))
  assertLength(readCustomProperty(printCss, '--bleed', printFile), printFile, '--bleed')

  const pagedFile = 'src/styles/paged.css'
  const paged = readText(path.join(root, pagedFile))
  if (!/size:\s*297mm\s+210mm\s*;/.test(paged)) {
    throw new Error(`${pagedFile} must keep the literal "size: 297mm 210mm".`)
  }

  if (!/size:\s*303mm\s+216mm\s*;/.test(printCss)) {
    throw new Error(`${printFile} must keep the literal "size: 303mm 216mm".`)
  }
  if (!/size:\s*216mm\s+303mm\s*;/.test(printCss)) {
    throw new Error(`${printFile} must keep the portrait bleed literal "size: 216mm 303mm".`)
  }

  /* Os estudos de caso trocam a folha para A4 retrato sem mexer no caderno. */
  const casoFile = 'src/styles/caso.css'
  const caso = readText(path.join(root, casoFile))
  const casoWidth = readCustomProperty(caso, '--page-width', casoFile)
  const casoHeight = readCustomProperty(caso, '--page-height', casoFile)
  if (casoWidth !== '210mm' || casoHeight !== '297mm') {
    throw new Error(`${casoFile} must set A4 portrait (210mm × 297mm); got ${casoWidth} × ${casoHeight}`)
  }
})

const referenced = new Set<string>()
const referencedAssets = new Set<string>()

const loadedDocuments = documents.filter((document) => document !== undefined)

for (const document of loadedDocuments) {
  const casoSections = document.sections.filter((section) => section.strategy === 'caso').length
  if (casoSections > 0 && casoSections !== document.sections.length) {
    fail(
      `${document.id} mixes caso and non-caso sections. A document has one page orientation, so caso sheets cannot share it with landscape sheets.`,
    )
  }
  for (const section of document.sections) {
    const absolute = path.join(contentDir, section.source)
    referenced.add(section.source)
    if (!existsSync(absolute) || !statSync(absolute).isFile()) {
      fail(`Missing content file: content/${section.source}`)
      continue
    }
    if (section.strategy === 'flow') {
      guard(() => checkMdx(absolute, section.source, referencedAssets))
    } else {
      const json = readJson(absolute)
      if (json !== undefined) {
        guard(() => {
          if (section.strategy === 'roteiro') {
            parseRoteiroPage(json, section.source)
          } else if (section.strategy === 'caso') {
            parseCasoPage(json, section.source)
          } else if (section.strategy === 'verso') {
            parseVersoPage(json, section.source)
          } else {
            parseWorkbookPage(json, section.source)
          }
        })
      }
    }
  }
}

if (loadedDocuments.length === manifestFiles.length) {
  guard(() => {
    for (const source of listContentFiles()) {
      if (!referenced.has(source)) {
        throw new Error(`content/${source} is not listed in a document manifest`)
      }
    }
  })
}

guard(() => {
  for (const asset of referencedAssets) {
    const relative = resolveAsset(asset)
    if (!existsSync(path.join(root, relative))) {
      throw new Error(`Missing asset "${asset}" (expected ${relative})`)
    }
  }
})

guard(() => {
  const mediaDir = path.join(root, 'assets', 'media')
  if (!existsSync(mediaDir)) return
  for (const file of readdirSync(mediaDir)) {
    if (file.startsWith('.') || file.startsWith('_')) continue
    const entryPath = path.join(mediaDir, file)
    if (statSync(entryPath).isDirectory()) continue
    const used = [...referencedAssets].some(
      (asset) => resolveAsset(asset) === path.posix.join('assets/media', file),
    )
    if (!used) {
      throw new Error(`assets/media/${file} is not referenced by content`)
    }
  }
})

if (errors.length > 0) {
  console.error(`Document validation failed (${errors.length})`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('Document validation passed')
if (loadedDocuments.length > 0) {
  const sections = loadedDocuments.reduce((total, document) => total + document.sections.length, 0)
  console.log(
    `${loadedDocuments.length} document(s) · ${sections} sections · ${referencedAssets.size} asset reference(s)`,
  )
}

function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as unknown
  } catch (error) {
    fail(`${path.relative(root, file)} is not valid JSON (${error instanceof Error ? error.message : error})`)
    return undefined
  }
}

function guardValue<T>(run: () => T): T | undefined {
  try {
    return run()
  } catch (error) {
    fail(error instanceof ContentError || error instanceof Error ? error.message : String(error))
    return undefined
  }
}

function checkMdx(file: string, source: string, assets: Set<string>) {
  const text = readFileSync(file, 'utf8')
  if (text.trim() === '') {
    throw new Error(`${source} is empty`)
  }
  if (/^import\s/m.test(text) || /^export\s/m.test(text)) {
    throw new Error(
      `${source} should use the shared MDX components and frontmatter, not import or export statements`,
    )
  }

  for (const match of text.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)) {
    const tag = match[1]
    if (tag && !allowedComponents.has(tag)) {
      throw new Error(
        `${source} uses unknown component <${tag}>. Allowed: ${[...allowedComponents].join(', ')}`,
      )
    }
  }

  const patterns = [
    /\bsrc="([^"]+)"/g,
    /\bsrc='([^']+)'/g,
    /\bsrc=\{"([^"]+)"\}/g,
    /\bsrc=\{'([^']+)'\}/g,
    /!\[[^\]]*\]\(([^)\s]+)\)/g,
  ]
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const ref = match[1]
      if (!ref || /^(https?:|data:|#|mailto:)/.test(ref)) {
        throw new Error(`${source} must use a local asset, not "${ref ?? ''}"`)
      }
      assets.add(ref)
    }
  }
}

function resolveAsset(reference: string): string {
  const clean = reference.replace(/^\.?\//, '')
  if (clean.startsWith('assets/')) return clean
  return path.posix.join('assets', clean)
}

function listContentFiles(): string[] {
  const files: string[] = []
  for (const folder of ['chapters', 'workbook', 'roteiros', 'casos', 'verso']) {
    const directory = path.join(contentDir, folder)
    if (!existsSync(directory)) continue
    for (const file of readdirSync(directory)) {
      if (file.startsWith('.')) continue
      if (!statSync(path.join(directory, file)).isFile()) continue
      files.push(path.posix.join(folder, file))
    }
  }
  return files
}
