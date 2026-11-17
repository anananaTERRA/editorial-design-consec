import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

/**
 * Gera as costas A4 da imposição duplex: uma arte contínua, sem emenda,
 * com um logo no centro de cada card.
 *
 * - `experiencias-verso-duplex-2.pdf`: dois cards (dois logos).
 * - `experiencias-verso-duplex-1.pdf`: um card; metade de baixo branca.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const html = path.join(root, 'scripts', 'verso', 'duplex.html')
const outDir = path.join(root, 'output')
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } })
  await page.goto(pathToFileURL(html).href, { waitUntil: 'load' })
  await page.waitForFunction(() =>
    [...document.images].every((image) => image.complete && image.naturalWidth > 0),
  )

  const pdf = {
    width: '210mm',
    height: '297mm',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  } as const

  await page.pdf({ path: path.join(outDir, 'experiencias-verso-duplex-2.pdf'), ...pdf })

  await page.evaluate(() => document.body.classList.add('single'))
  await page.pdf({ path: path.join(outDir, 'experiencias-verso-duplex-1.pdf'), ...pdf })

  console.log('Verso duplex gerado:')
  console.log('  output/experiencias-verso-duplex-2.pdf (dois cards)')
  console.log('  output/experiencias-verso-duplex-1.pdf (um card + metade branca)')
} finally {
  await browser.close()
}
