import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFDocument, rgb } from 'pdf-lib'

/**
 * Imposição duplex: duas páginas A5 paisagem por folha A4 retrato.
 *
 * As páginas do PDF digital são A4 paisagem (297 × 210 mm). Reduzidas a
 * 210 × 148,5 mm, duas cabem exatamente em uma folha A4 retrato (210 × 297 mm).
 *
 * As costas vêm de uma arte A4 contínua (`experiencias-verso-duplex-2.pdf`),
 * com o roxo sem emenda e um logo no centro de cada card. A última folha usa
 * a versão de um card (`experiencias-verso-duplex-1.pdf`).
 *
 * A saída intercala frente e verso (f1, v1, f2, v2, f3, v3) para impressão
 * duplex virando na borda longa.
 */

const MM = 72 / 25.4
const A4_WIDTH = 210 * MM
const A4_HEIGHT = 297 * MM
const HALF_HEIGHT = A4_HEIGHT / 2
/** Margem de segurança da impressora (área não imprimível): 5 mm. */
const SAFETY = 5 * MM
const CUT_MARK_LENGTH = SAFETY * 2
const CUT_MARK_COLOR = rgb(0.55, 0.62, 0.68)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const input = process.argv[2] ?? path.join(root, 'output', 'experiencias-digital.pdf')
const output = process.argv[3] ?? path.join(root, 'output', 'experiencias-a5-duplex.pdf')
const backTwo = path.join(root, 'output', 'experiencias-verso-duplex-2.pdf')
const backOne = path.join(root, 'output', 'experiencias-verso-duplex-1.pdf')

for (const file of [input, backTwo, backOne]) {
  if (!existsSync(file)) {
    console.error(`Arquivo não encontrado: ${path.relative(root, file)}`)
    console.error('Gere com: npm run gerar-pdf-experiencias-a5')
    process.exit(1)
  }
}

const source = await PDFDocument.load(readFileSync(input), { ignoreEncryption: true })
const twoDoc = await PDFDocument.load(readFileSync(backTwo), { ignoreEncryption: true })
const oneDoc = await PDFDocument.load(readFileSync(backOne), { ignoreEncryption: true })
const imposed = await PDFDocument.create()

const pages = await imposed.embedPdf(source, source.getPageIndices())
if (pages.length < 2) {
  console.error('O PDF precisa ter ao menos uma frente e o verso.')
  process.exit(1)
}

/* A última página do digital é a arte do verso da página; a imposição usa
   as costas contínuas e não ela. */
const fronts = pages.slice(0, -1)
const [backTwoPage] = await imposed.embedPdf(twoDoc, twoDoc.getPageIndices())
const [backOnePage] = await imposed.embedPdf(oneDoc, oneDoc.getPageIndices())

for (let index = 0; index < fronts.length; index += 2) {
  const first = fronts[index]
  const second = fronts[index + 1]

  /* Frente: dois cards, com as marcas de corte na margem de segurança. */
  const front = imposed.addPage([A4_WIDTH, A4_HEIGHT])
  drawPage(front, first, HALF_HEIGHT)
  if (second) drawPage(front, second, 0)
  drawCutMarks(front)

  /* Verso: arte A4 contínua, alinhada atrás de cada card. */
  const back = imposed.addPage([A4_WIDTH, A4_HEIGHT])
  const backArt = second ? backTwoPage : backOnePage
  if (backArt) back.drawPage(backArt, { x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT })
}

imposed.setTitle('Experiências das Redes de Ensino — A5 duplex')
imposed.setAuthor('CONSED')
imposed.setSubject('Frente e verso, duas páginas A5 paisagem por folha A4 retrato')

mkdirSync(path.dirname(output), { recursive: true })
writeFileSync(output, await imposed.save())

const sheets = Math.ceil(fronts.length / 2)
console.log(
  `Imposição duplex: ${fronts.length} frentes + verso → ${sheets} folhas A4 retrato (${sheets * 2} páginas)`,
)
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

/**
 * Marcas só na frente, no meio da folha: uma cruz em cada lado, com o
 * cruzamento exatamente na linha de corte. O verso fica limpo.
 */
function drawCutMarks(sheet: ReturnType<PDFDocument['addPage']>) {
  const y = HALF_HEIGHT
  const half = SAFETY / 2
  const options = { thickness: 0.35, color: CUT_MARK_COLOR }
  for (const side of ['left', 'right'] as const) {
    const start = side === 'left' ? 0 : A4_WIDTH - CUT_MARK_LENGTH
    sheet.drawLine({
      start: { x: start, y },
      end: { x: start + CUT_MARK_LENGTH, y },
      ...options,
    })
    sheet.drawLine({
      start: { x: start + SAFETY, y: y - half },
      end: { x: start + SAFETY, y: y + half },
      ...options,
    })
  }
}
