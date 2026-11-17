import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFDocument, rgb } from 'pdf-lib'

/**
 * Imposição 2-up: duas páginas A5 paisagem por folha A4 retrato.
 *
 * As páginas do PDF digital são A4 paisagem (297 × 210 mm). Reduzidas a
 * 210 × 148,5 mm, duas cabem exatamente em uma folha A4 retrato (210 × 297 mm).
 * A ordem é sequencial: 1–2, 3–4, 5–verso. A última metade não sobra.
 */

const MM = 72 / 25.4
const A4_WIDTH = 210 * MM
const A4_HEIGHT = 297 * MM
const HALF_HEIGHT = A4_HEIGHT / 2
const CUT_MARK_LENGTH = 5 * MM
const CUT_MARK_INSET = 10 * MM
const CUT_MARK_COLOR = rgb(0.55, 0.62, 0.68)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const input = process.argv[2] ?? path.join(root, 'output', 'experiencias-digital.pdf')
const output = process.argv[3] ?? path.join(root, 'output', 'experiencias-a5-2up.pdf')

if (!existsSync(input)) {
  console.error(`PDF de origem não encontrado: ${input}`)
  console.error('Gere primeiro com: npm run gerar-pdf-experiencias')
  process.exit(1)
}

const source = await PDFDocument.load(readFileSync(input), { ignoreEncryption: true })
const imposed = await PDFDocument.create()
const pages = await imposed.embedPdf(source, source.getPageIndices())

for (let index = 0; index < pages.length; index += 2) {
  const sheet = imposed.addPage([A4_WIDTH, A4_HEIGHT])
  drawPage(sheet, pages[index], HALF_HEIGHT)
  if (pages[index + 1]) drawPage(sheet, pages[index + 1], 0)
  drawCutMarks(sheet)
}

imposed.setTitle('Experiências das Redes de Ensino — A5 2-up')
imposed.setAuthor('CONSED')
imposed.setSubject('Imposição para impressão em A5 paisagem')

mkdirSync(path.dirname(output), { recursive: true })
writeFileSync(output, await imposed.save())

const sheets = Math.ceil(pages.length / 2)
console.log(`Imposição A5 2-up: ${pages.length} páginas → ${sheets} folhas A4 retrato`)
console.log(`Saída: ${path.relative(root, output)}`)

function drawPage(
  sheet: ReturnType<PDFDocument['addPage']>,
  page: Awaited<ReturnType<PDFDocument['embedPdf']>>[number],
  offsetY: number,
) {
  const scale = Math.min(A4_WIDTH / page.width, HALF_HEIGHT / page.height)
  const width = page.width * scale
  const height = page.height * scale
  const x = (A4_WIDTH - width) / 2
  const y = offsetY + (HALF_HEIGHT - height) / 2
  sheet.drawPage(page, { x, y, width, height })
}

function drawCutMarks(sheet: ReturnType<PDFDocument['addPage']>) {
  const y = HALF_HEIGHT
  const leftStart = CUT_MARK_INSET
  const rightEnd = A4_WIDTH - CUT_MARK_INSET
  const options = { thickness: 0.35, color: CUT_MARK_COLOR }
  sheet.drawLine({
    start: { x: leftStart, y },
    end: { x: leftStart + CUT_MARK_LENGTH, y },
    ...options,
  })
  sheet.drawLine({
    start: { x: rightEnd - CUT_MARK_LENGTH, y },
    end: { x: rightEnd, y },
    ...options,
  })
}
