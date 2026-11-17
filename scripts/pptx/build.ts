import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  deckPaths,
  diffFingerprints,
  extract,
  fingerprint,
  pack,
  readEdits,
  readManifest,
  replaceText,
  slideFile,
  slideOrder,
  writeJson,
  type EditOutcome,
} from './lib'

/**
 * Aplica as edições listadas em content/apresentacao/<deck>.edits.json sobre
 * uma cópia do arquivo original e gera output/<deck>.pptx.
 *
 * Só os slides citados são reescritos. Os demais arquivos internos do .pptx
 * saem byte a byte iguais, e o relatório prova isso por hash.
 */
const manifest = readManifest()
const paths = deckPaths(manifest)

if (!readFileSync(paths.manifestFile, 'utf8').includes(manifest.id)) {
  throw new Error(`Manifesto inválido: ${paths.manifestFile}`)
}

const work = extract(manifest)
const before = fingerprint(work)

const edits = readEdits(manifest).filter((edit) => edit.status !== 'ignorado')
const applied = new Map<number, string>()
const results: { id: string; slide: number; outcome: EditOutcome }[] = []

for (const edit of edits) {
  const file = slideFile(work, edit.slide)
  const current = applied.get(edit.slide) ?? readFileSync(file, 'utf8')
  const { xml, outcome } = replaceText(current, edit.find, edit.replace, edit.occurrence ?? 1)
  if (outcome.status === 'aplicado') applied.set(edit.slide, xml)
  results.push({ id: edit.id, slide: edit.slide, outcome })
}

for (const [slide, xml] of applied) {
  writeFileSync(slideFile(work, slide), xml)
}

pack(work, paths.build)
const after = fingerprint(work)
const diff = diffFingerprints(before, after)

const failed = results.filter(
  (result) => result.outcome.status === 'nao-encontrado' || result.outcome.status === 'spans-runs',
)

writeJson(path.join(path.dirname(paths.build), `${manifest.id}.relatorio.json`), {
  deck: manifest.id,
  build: path.relative(process.cwd(), paths.build),
  slides: slideOrder(work).length,
  edits: results.map((result) => ({
    id: result.id,
    slide: result.slide,
    status: result.outcome.status,
    detail: result.outcome.detail,
  })),
  changedParts: diff.changed,
  untouchedParts: after.size - diff.changed.length,
})

console.log(`${manifest.id}: ${slideOrder(work).length} slides → ${path.relative(process.cwd(), paths.build)}`)
console.log('')
if (results.length === 0) {
  console.log('Nenhuma edição pendente. O arquivo é uma cópia fiel do original.')
}
for (const result of results) {
  const icon =
    result.outcome.status === 'aplicado'
      ? 'ok  '
      : result.outcome.status === 'ignorado'
        ? '--  '
        : 'ERRO'
  console.log(`${icon} slide ${String(result.slide).padStart(2, '0')}  ${result.id}  — ${result.outcome.detail}`)
}
console.log('')
console.log(`partes alteradas: ${diff.changed.length ? diff.changed.join(', ') : 'nenhuma'}`)
console.log(`partes intactas: ${after.size - diff.changed.length} de ${after.size}`)

if (failed.length > 0) {
  console.error('')
  console.error(`${failed.length} edição(ões) não aplicada(s). Corrija o texto em content/apresentacao/${manifest.id}.edits.json.`)
  process.exit(1)
}
