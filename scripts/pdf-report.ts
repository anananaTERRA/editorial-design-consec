import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'

export type MediaBox = [number, number, number, number]

export type PdfReport = {
  bytes: number
  pageCount: number
  pageCountSource: string
  mediaBoxes: MediaBox[]
  fonts: string[]
}

/** A4 landscape in PostScript points. */
export const LANDSCAPE_WIDTH_PT = 841.89
export const LANDSCAPE_HEIGHT_PT = 595.28

/** A4 portrait in PostScript points. */
export const PORTRAIT_WIDTH_PT = 595.28
export const PORTRAIT_HEIGHT_PT = 841.89

export type PageOrientation = 'landscape' | 'portrait'

const TOLERANCE_PT = 8
const MIN_PAGES = 1

export function inspectPdf(file: string): PdfReport {
  const data = readFileSync(file)
  const text = data.toString('latin1')
  const pageObjects = text.match(/\/Type\s*\/Page(?!s)/g)?.length ?? 0
  const info = readPdfInfo(file)
  const infoPages = info ? Number(info.match(/^Pages:\s+(\d+)/m)?.[1]) : Number.NaN

  let pageCount = 0
  let pageCountSource = 'unresolved'
  if (Number.isFinite(infoPages) && infoPages > 0) {
    pageCount = infoPages
    pageCountSource = 'pdfinfo'
  } else if (pageObjects > 0) {
    pageCount = pageObjects
    pageCountSource = 'page-objects'
  }

  const mediaBoxes = [
    ...text.matchAll(
      /\/MediaBox\s*\[\s*(-?[0-9.]+)\s+(-?[0-9.]+)\s+(-?[0-9.]+)\s+(-?[0-9.]+)\s*\]/g,
    ),
  ].map(
    (match) =>
      [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4])] as MediaBox,
  )

  const fonts = [
    ...new Set([...text.matchAll(/\/BaseFont\s*\/([^\s[\]<>/]+)/g)].map((match) => match[1])),
  ]

  return {
    bytes: data.length,
    pageCount,
    pageCountSource,
    mediaBoxes,
    fonts,
  }
}

/** Fallback when the PDF is compressed. */
export async function inspectPdfResolved(file: string): Promise<PdfReport> {
  const report = inspectPdf(file)
  if (report.pageCount > 0 && report.mediaBoxes.length > 0) {
    return report
  }
  const data = readFileSync(file)
  const doc = await PDFDocument.load(data, { ignoreEncryption: true })
  const pageCount = doc.getPageCount()
  if (pageCount < 1) {
    return report
  }
  const first = doc.getPage(0)
  return {
    ...report,
    pageCount,
    pageCountSource: 'pdf-lib',
    mediaBoxes: [[0, 0, first.getWidth(), first.getHeight()]],
  }
}

export function assertPdfProfile(
  profile: 'digital' | 'print',
  report: PdfReport,
  orientation: PageOrientation = 'landscape',
): void {
  if (report.pageCount < MIN_PAGES) {
    throw new Error(`Expected at least ${MIN_PAGES} page, found ${report.pageCount}.`)
  }

  const box = report.mediaBoxes[0]
  if (!box) {
    throw new Error('No MediaBox found in the PDF.')
  }

  const width = box[2] - box[0]
  const height = box[3] - box[1]
  const trimWidth = orientation === 'portrait' ? PORTRAIT_WIDTH_PT : LANDSCAPE_WIDTH_PT
  const trimHeight = orientation === 'portrait' ? PORTRAIT_HEIGHT_PT : LANDSCAPE_HEIGHT_PT
  const orientationLabel = orientation === 'portrait' ? 'portrait' : 'landscape'

  if (profile === 'digital') {
    const widthOk = Math.abs(width - trimWidth) <= TOLERANCE_PT
    const heightOk = Math.abs(height - trimHeight) <= TOLERANCE_PT
    if (!widthOk || !heightOk) {
      throw new Error(
        `Digital PDF media box is ${width.toFixed(2)} × ${height.toFixed(2)} pt. Expected A4 ${orientationLabel} (${trimWidth} × ${trimHeight}).`,
      )
    }
    return
  }

  if (width <= trimWidth + TOLERANCE_PT || height <= trimHeight + TOLERANCE_PT) {
    throw new Error(
      `Print layout media box is ${width.toFixed(2)} × ${height.toFixed(2)} pt. Bleed should make it larger than the A4 ${orientationLabel} trim.`,
    )
  }
}

export function formatPdfReport(file: string, report: PdfReport): string {
  const box = report.mediaBoxes[0]
  const size = box
    ? `${(box[2] - box[0]).toFixed(2)} × ${(box[3] - box[1]).toFixed(2)} pt`
    : 'unknown'
  const fonts = report.fonts.length > 0 ? report.fonts.join(', ') : 'none found in clear text'
  return [
    file,
    `bytes: ${report.bytes}`,
    `pages: ${report.pageCount} (${report.pageCountSource})`,
    `media: ${size}`,
    `fonts: ${fonts}`,
  ].join('\n')
}

function readPdfInfo(file: string): string | null {
  const result = spawnSync('pdfinfo', [file], { encoding: 'utf8' })
  if (result.error || result.status !== 0 || !result.stdout) return null
  return result.stdout
}
