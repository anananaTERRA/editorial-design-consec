import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { assertPdfProfile, formatPdfReport, inspectPdfResolved } from './pdf-report'
import { prepareDomForPdfExportInBrowser } from './pdf-dom-prepare'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const previewPort = 4174

const profile = readFlag('--profile')
if (profile !== 'digital' && profile !== 'print') {
  console.error(
    'Usage: tsx scripts/build-pdf.ts --profile digital|print [--doc oficinas|experiencias|casos]',
  )
  process.exit(1)
}

const requestedDocument = readFlag('--doc') ?? 'oficinas'
if (
  requestedDocument !== 'oficinas' &&
  requestedDocument !== 'experiencias' &&
  requestedDocument !== 'casos'
) {
  console.error(
    'Usage: tsx scripts/build-pdf.ts --profile digital|print [--doc oficinas|experiencias|casos]',
  )
  process.exit(1)
}

const documentOutput = requestedDocument === 'oficinas' ? 'document' : requestedDocument
const outputPath = path.join(
  root,
  'output',
  profile === 'print' ? `${documentOutput}-print.pdf` : `${documentOutput}-digital.pdf`,
)
mkdirSync(path.dirname(outputPath), { recursive: true })

/**
 * Page size and margins used by Chromium. They mirror paged.css (digital)
 * and print.css (A4 plus 3mm bleed on every edge). The case studies are the
 * only portrait document; the workbook and the scripts stay landscape.
 */
const geometry =
  requestedDocument === 'casos'
    ? ({
        digital: {
          width: '210mm',
          height: '297mm',
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
        },
        print: {
          width: '216mm',
          height: '303mm',
          margin: { top: '3mm', right: '3mm', bottom: '3mm', left: '3mm' },
        },
      } as const)
    : ({
        digital: {
          width: '297mm',
          height: '210mm',
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
        },
        print: {
          width: '303mm',
          height: '216mm',
          margin: { top: '3mm', right: '3mm', bottom: '3mm', left: '3mm' },
        },
      } as const)

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
run(npm, ['run', 'validate'])
run(npm, ['run', profile === 'print' ? 'build:print' : 'build:digital'])

const preview = startPreview()
let printFailed = false
try {
  await waitForPort(previewPort)
  await printSite(outputPath, profile)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  printFailed = true
} finally {
  if (!preview.killed) preview.kill('SIGTERM')
}
if (printFailed) process.exit(1)

const report = await inspectPdfResolved(outputPath)
console.log(`\n${formatPdfReport(outputPath, report)}`)
try {
  assertPdfProfile(profile, report, requestedDocument === 'casos' ? 'portrait' : 'landscape')
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

function startPreview(): ChildProcess {
  const viteBin = path.join(
    root,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'vite.cmd' : 'vite',
  )
  console.log(`\n> vite preview --host 127.0.0.1 --port ${previewPort}`)
  const child = spawn(
    viteBin,
    ['preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort'],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  child.stdout?.on('data', (chunk: Buffer) => process.stdout.write(chunk))
  child.stderr?.on('data', (chunk: Buffer) => process.stderr.write(chunk))
  return child
}

type PdfOutputProfile = keyof typeof geometry

async function printSite(file: string, outputProfile: PdfOutputProfile) {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({
      viewport:
        requestedDocument === 'casos'
          ? { width: 794, height: 1123 }
          : { width: 1123, height: 794 },
    })
    page.setDefaultTimeout(180_000)
    page.setDefaultNavigationTimeout(180_000)
    const documentQuery =
      requestedDocument === 'oficinas' ? '' : `?doc=${requestedDocument}`
    await page.goto(`http://127.0.0.1:${previewPort}/${documentQuery}`, {
      waitUntil: 'networkidle',
    })
    await page.waitForFunction(() => {
      const root = globalThis as unknown as {
        document: { documentElement: { dataset: { pagesReady?: string } } }
      }
      return root.document.documentElement.dataset.pagesReady === '1'
    })
    const sheetCount = await page.locator('.desk .sheet').count()
    if (sheetCount < 1) {
      throw new Error(
        `O site não paginou nenhuma folha A4 ${requestedDocument === 'casos' ? 'retrato' : 'paisagem'} antes da impressão.`,
      )
    }
    await page.emulateMedia({ media: 'print' })
    await page.evaluate(prepareDomForPdfExportInBrowser)
    const box = geometry[outputProfile]
    const printOverride = `@page { size: ${box.width} ${box.height}; margin: 0; }`
    await page.addStyleTag({
      content: [
        printOverride,
        '@page :first { margin: 0; }',
        '@page :left { margin: 0; }',
        '@page :right { margin: 0; }',
        'html, body, #root, .desk { margin: 0 !important; padding: 0 !important; }',
      ].join('\n'),
    })
    await page.pdf({
      path: file,
      width: box.width,
      height: box.height,
      margin: box.margin,
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: false,
    })
  } finally {
    await browser.close()
  }
}

function waitForPort(port: number, timeoutMs = 30_000): Promise<void> {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const socket = net.connect(port, '127.0.0.1')
      const fail = () => {
        socket.destroy()
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`A prévia estática não abriu na porta ${port}.`))
          return
        }
        setTimeout(tryOnce, 250)
      }
      socket.once('connect', () => {
        socket.end()
        resolve()
      })
      socket.once('error', fail)
    }
    tryOnce()
  })
}

function readFlag(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function run(command: string, args: string[]) {
  console.log(`\n> ${[command, ...args].join(' ')}`)
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' })
  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
