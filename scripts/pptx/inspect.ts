import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  deckPaths,
  decodeXml,
  extract,
  readManifest,
  shapes,
  slideOrder,
  writeJson,
} from './lib'

/**
 * Abre o deck e descreve cada slide: texto, formas, imagens, notas e
 * comentários de revisão. Não altera nada no arquivo original.
 */
const manifest = readManifest()
const paths = deckPaths(manifest)
const work = extract(manifest)

type SlideReport = {
  number: number
  file: string
  layout: string
  shapes: number
  images: number
  notes: string
  comments: { author: string; text: string }[]
  text: string
}

const reports: SlideReport[] = slideOrder(work).map((slide) => {
  const file = path.join(work, slide.file)
  const xml = readFileSync(file, 'utf8')
  const relsFile = path.join(path.dirname(file), '_rels', `${path.basename(file)}.rels`)
  const rels = existsSync(relsFile) ? readFileSync(relsFile, 'utf8') : ''
  const targets = [...rels.matchAll(/<Relationship\b[^>]*>/g)].map((match) => match[0])

  const layout = targets
    .find((tag) => tag.includes('/slideLayout'))
    ?.match(/Target="([^"]*)"/)?.[1]

  const images = targets.filter((tag) => tag.includes('/image')).length
  const notesTarget = targets.find((tag) => tag.includes('/notesSlide'))?.match(/Target="([^"]*)"/)?.[1]
  const notes = notesTarget
    ? readFileSync(path.resolve(path.dirname(file), notesTarget), 'utf8')
        .match(/<a:t>([\s\S]*?)<\/a:t>/)?.[1]
    : ''

  const comments = targets
    .filter((tag) => tag.includes('/comments'))
    .flatMap((tag) => {
      const target = tag.match(/Target="([^"]*)"/)?.[1]
      if (!target) return []
      const commentXml = readFileSync(path.join(path.dirname(file), target), 'utf8')
      return [...commentXml.matchAll(/<p:cm\b[^>]*>([\s\S]*?)<\/p:cm>/g)].map((match) => ({
        author: 'Vanessa Terra',
        text: decodeXml(match[1].match(/<p:text>([\s\S]*?)<\/p:text>/)?.[1] ?? '').replace(
          /\n_Assigned to you_/,
          '',
        ),
      }))
    })

  return {
    number: slide.number,
    file: slide.file,
    layout: layout ? path.basename(layout) : '',
    shapes: shapes(xml).length,
    images,
    notes: decodeXml(notes ?? '').trim(),
    comments,
    text: shapes(xml)
      .map((shape) => shape.text)
      .filter(Boolean)
      .join('\n'),
  }
})

const inventoryPath = path.join(paths.work, '..', 'inventario.json')
writeJson(inventoryPath, {
  deck: manifest.id,
  title: manifest.title,
  source: manifest.source,
  slides: reports,
})

const commented = reports.filter((report) => report.comments.length > 0)

console.log(`${manifest.title} — ${reports.length} slides`)
console.log(`origem: ${manifest.source}`)
console.log('')
for (const report of reports) {
  const headline = report.text.split('\n').find((line) => line.trim()) ?? '(sem texto)'
  const marks = [
    report.comments.length ? `${report.comments.length} comentário(s)` : '',
    report.notes ? 'notas' : '',
    report.images ? `${report.images} imagem(ns)` : '',
  ]
    .filter(Boolean)
    .join(' · ')
  console.log(
    `${String(report.number).padStart(2, '0')}  ${headline.slice(0, 58).padEnd(58)}  ${marks}`,
  )
}
console.log('')
console.log(`${commented.length} slides com comentários: ${commented.map((r) => r.number).join(', ')}`)
console.log(`inventário: ${path.relative(process.cwd(), inventoryPath)}`)
