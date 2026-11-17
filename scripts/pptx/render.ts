import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { PDFDocument } from 'pdf-lib'
import {
  deckPaths,
  extract,
  hiddenSlides,
  readEdits,
  readManifest,
  run,
  slideOrder,
} from './lib'

/**
 * Renderiza o deck em PDF e em PNG por slide, e monta uma folha de contato
 * para conferência no navegador.
 *
 * O LibreOffice converte o .pptx em PDF; o macOS (sips) rasteriza cada página.
 * Nenhuma dependência de poppler ou ImageMagick.
 */
const manifest = readManifest()
const paths = deckPaths(manifest)
const source = existsSync(paths.build) ? paths.build : paths.master
const previewDir = paths.preview

const soffice =
  [
    '/Applications/LibreOffice.app/Contents/MacOS/soffice',
    '/usr/local/bin/soffice',
  ].find((candidate) => existsSync(candidate)) ?? ''

if (!soffice) {
  console.error('LibreOffice não encontrado. Instale com: brew install --cask libreoffice')
  process.exit(1)
}
if (!existsSync(paths.work)) extract(manifest)

rmSync(previewDir, { recursive: true, force: true })
mkdirSync(previewDir, { recursive: true })

const profile = path.join(previewDir, '.lo-profile')
run(soffice, [
  '--headless',
  '--norestore',
  `-env:UserInstallation=file://${profile}`,
  '--convert-to',
  'pdf',
  '--outdir',
  previewDir,
  source,
])
rmSync(profile, { recursive: true, force: true })

const produced = readdirSync(previewDir).find((file) => file.endsWith('.pdf'))
if (!produced) throw new Error('O LibreOffice não gerou o PDF da prévia')
const pdf = path.join(previewDir, 'previa.pdf')
renameSync(path.join(previewDir, produced), pdf)

const document = await PDFDocument.load(readFileSync(pdf))
const pageCount = document.getPageCount()
const pageDir = path.join(previewDir, '.paginas')
mkdirSync(pageDir, { recursive: true })

for (let index = 0; index < pageCount; index += 1) {
  const single = await PDFDocument.create()
  const [page] = await single.copyPages(document, [index])
  single.addPage(page)
  const file = path.join(pageDir, `pagina-${index + 1}.pdf`)
  writeFileSync(file, await single.save())
  run('sips', [
    '-s',
    'format',
    'png',
    '-Z',
    '2000',
    file,
    '--out',
    path.join(previewDir, `slide-${String(index + 1).padStart(2, '0')}.png`),
  ])
}
rmSync(pageDir, { recursive: true, force: true })

const pages = readdirSync(previewDir)
  .filter((file) => /^slide-\d+\.png$/.test(file))
  .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))
const hidden = hiddenSlides(paths.work)
const visible = slideOrder(paths.work).filter((slide) => !hidden.has(slide.number))
const total = visible.length

const edited = new Set(
  readEdits(manifest)
    .filter((edit) => edit.status !== 'ignorado')
    .map((edit) => edit.slide),
)

const cards = pages
  .map((file, index) => {
    const number = visible[index]?.number ?? index + 1
    const mark = edited.has(number) ? '<span class="tag">editado</span>' : ''
    return `      <figure class="slide">
        <a href="${file}"><img src="${file}" alt="Slide ${number}" loading="lazy"></a>
        <figcaption><b>${String(number).padStart(2, '0')}</b>${mark}</figcaption>
      </figure>`
  })
  .join('\n')

const html = `<!doctype html>
<html lang="pt-BR">
<meta charset="utf-8">
<title>${manifest.title} — prévia</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 32px 24px 64px;
    background: #14161a;
    color: #e8ebef;
    font: 13px/1.4 ui-sans-serif, -apple-system, "Segoe UI", sans-serif;
  }
  header { max-width: 1500px; margin: 0 auto 28px; }
  h1 { font-size: 18px; font-weight: 600; margin: 0 0 4px; }
  p { margin: 0; color: #8d97a5; }
  .grid {
    max-width: 1500px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
    gap: 22px 26px;
  }
  .slide { margin: 0; }
  .slide img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    background: #fff;
    border-radius: 3px;
    box-shadow: 0 1px 0 rgba(255,255,255,.08), 0 8px 24px rgba(0,0,0,.45);
  }
  figcaption {
    display: flex;
    gap: 8px;
    align-items: center;
    padding-top: 8px;
    color: #7d8794;
    font-variant-numeric: tabular-nums;
  }
  figcaption b { color: #cfd6df; font-weight: 600; }
  .tag {
    border: 1px solid #3f6b4a;
    color: #7fd18f;
    border-radius: 999px;
    padding: 0 7px;
    font-size: 11px;
    line-height: 17px;
  }
</style>
<header>
  <h1>${manifest.title}</h1>
  <p>${visible.length} slides visíveis${hidden.size ? ` · ${hidden.size} oculto(s): ${[...hidden].join(', ')}` : ''} · ${manifest.geometry.widthIn} × ${manifest.geometry.heightIn} in · ${path.basename(source)}</p>
</header>
<div class="grid">
${cards}
</div>
</html>
`

writeFileSync(path.join(previewDir, 'index.html'), html)

console.log(`${pages.length} slides renderizados em ${path.relative(process.cwd(), previewDir)}`)
console.log(`folha de contato: file://${path.join(previewDir, 'index.html')}`)
console.log(`pdf: ${path.relative(process.cwd(), pdf)}`)

if (pages.length !== total) {
  console.error(`Esperava ${total} slides, o renderizador devolveu ${pages.length}.`)
  process.exit(1)
}
