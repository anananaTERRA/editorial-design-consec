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
 * No caderno de experiências, as costas vêm de uma arte A4 contínua
 * (`experiencias-verso-duplex-2.pdf`), com o roxo sem emenda e um logo no
 * centro de cada card. A última folha usa a versão de um card
 * (`experiencias-verso-duplex-1.pdf`).
 *
 * Com `--sem-verso`, o PDF de origem não tem arte de verso (é o caso do
 * cronograma): todas as páginas viram frentes e nenhuma é descartada.
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
const cardsOnly = process.argv.includes('--sem-verso')
const frontsOnly = process.argv.includes('--frente') || cardsOnly
/** Optional card index (1-based) after which a new A4 sheet starts: `--quebra=3`. */
const breakAfter = process.argv
  .filter((argument) => argument.startsWith('--quebra='))
  .flatMap((argument) => argument.slice('--quebra='.length).split(','))
  .map(Number)
  .filter((value) => Number.isInteger(value) && value > 0)
const positional = process.argv.slice(2).filter((argument) => !argument.startsWith('--'))
const input =
  positional[0] ??
  path.join(
    root,
    'output',
    cardsOnly ? 'cronograma-digital.pdf' : 'experiencias-digital.pdf',
  )
const output =
  positional[1] ??
  path.join(
    root,
    'output',
    cardsOnly
      ? 'cronograma-a5-frente.pdf'
      : frontsOnly
        ? 'experiencias-a5-frente.pdf'
        : 'experiencias-a5-duplex.pdf',
  )
const backTwo = path.join(root, 'output', 'experiencias-verso-duplex-2.pdf')
const backOne = path.join(root, 'output', 'experiencias-verso-duplex-1.pdf')

for (const file of [input, ...(frontsOnly ? [] : [backTwo, backOne])]) {
  if (!existsSync(file)) {
    console.error(`Arquivo não encontrado: ${path.relative(root, file)}`)
    console.error(
      cardsOnly
        ? 'Gere com: npm run gerar-pdf-cronograma-a5'
        : 'Gere com: npm run gerar-pdf-experiencias-a5',
    )
    process.exit(1)
  }
}

const source = await PDFDocument.load(readFileSync(input), { ignoreEncryption: true })
const twoDoc = frontsOnly
  ? undefined
  : await PDFDocument.load(readFileSync(backTwo), { ignoreEncryption: true })
const oneDoc = frontsOnly
  ? undefined
  : await PDFDocument.load(readFileSync(backOne), { ignoreEncryption: true })
const imposed = await PDFDocument.create()

const pages = await imposed.embedPdf(source, source.getPageIndices())
if (pages.length < (cardsOnly ? 1 : 2)) {
  console.error(
    cardsOnly
      ? 'O PDF de fichas precisa ter ao menos uma página.'
      : 'O PDF precisa ter ao menos uma frente e o verso.',
  )
  process.exit(1)
}

/* No caderno de experiências a última página do digital é a arte do verso da
   página; a imposição usa as costas contínuas e não ela. Nas fichas sem verso
   (cronograma), todas as páginas são frentes. */
const fronts = cardsOnly ? pages : pages.slice(0, -1)

/* `--quebra=N` insere uma ficha em branco depois do card N, para começar uma
   nova folha (por exemplo, separar o Dia 1 do Dia 2). */
const slots: ((typeof fronts)[number] | null)[] = [...fronts]
for (const after of [...breakAfter].sort((a, b) => b - a)) {
  if (after < slots.length) slots.splice(after, 0, null)
}
const backTwoPage = twoDoc
  ? (await imposed.embedPdf(twoDoc, twoDoc.getPageIndices()))[0]
  : undefined
const backOnePage = oneDoc
  ? (await imposed.embedPdf(oneDoc, oneDoc.getPageIndices()))[0]
  : undefined

for (let index = 0; index < slots.length; index += 2) {
  const first = slots[index]
  const second = slots[index + 1]

  /* Frente: dois cards, com as marcas de corte na margem de segurança. */
  const front = imposed.addPage([A4_WIDTH, A4_HEIGHT])
  if (first) drawPage(front, first, HALF_HEIGHT)
  if (second) drawPage(front, second, 0)
  drawCutMarks(front)

  if (frontsOnly) continue

  /* Verso: arte A4 contínua, alinhada atrás de cada card. */
  const back = imposed.addPage([A4_WIDTH, A4_HEIGHT])
  const backArt = second ? backTwoPage : backOnePage
  if (backArt) back.drawPage(backArt, { x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT })
}

imposed.setTitle(
  cardsOnly
    ? 'Minuto a minuto — fichas A5'
    : frontsOnly
      ? 'Experiências das Redes de Ensino — A5 frente'
      : 'Experiências das Redes de Ensino — A5 duplex',
)
imposed.setAuthor('CONSED')
imposed.setSubject(
  cardsOnly
    ? 'Duas fichas A5 paisagem por folha A4 retrato, prontas para corte'
    : frontsOnly
      ? 'Somente as frentes, duas páginas A5 paisagem por folha A4 retrato'
      : 'Frente e verso, duas páginas A5 paisagem por folha A4 retrato',
)

mkdirSync(path.dirname(output), { recursive: true })
writeFileSync(output, await imposed.save())

const sheets = Math.ceil(slots.length / 2)
console.log(
  cardsOnly
    ? `Imposição de fichas: ${fronts.length} cards → ${sheets} folhas A4 retrato`
    : frontsOnly
      ? `Imposição só de frente: ${fronts.length} cards → ${sheets} folhas A4 retrato`
      : `Imposição duplex: ${fronts.length} frentes + verso → ${sheets} folhas A4 retrato (${sheets * 2} páginas)`,
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
