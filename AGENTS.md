# Agent notes

This repository builds the CONSED editorial documents as a React site (Vite) and exports a PDF by printing that site with Chromium. The workshop workbook and the interview scripts are **A4 landscape**; the case studies are **A4 portrait**. Read this file before changing the pipeline, the page models, or the content.

## Operational workflow

- Work in the Vite preview (`npm run dev` / `visualizar`, http://127.0.0.1:5173). The site is the proof.
- Do **not** auto-run `validate`, `build`, `gerar-pdf`, or any PDF command when finishing a task. The team runs those manually.
- During a **text-cut round**, change copy only. Do not fill empty space, change panel heights, or reflow a workshop onto another page unless the editor asks.
- Preserve every editor-agreed treatment (components, layout classes, CSS, assets) until they ask to change it.
- Human editors are non-technical. `docs/EDITAR-COM-AGENTE.md` gives examples in natural Portuguese.

## Architecture

Three layers stay separate:

1. **Content** — each document has its own reading order. `content/document.json` lists the ten workshop sheets in `content/workbook/`; `content/document-experiencias.json` lists the five interview scripts in `content/roteiros/` and the purple back page in `content/verso/`; `content/document-casos.json` lists the four case studies in `content/casos/`; `content/document-cronograma.json` lists the six schedule cards in `content/cronograma/`. The project has no cover page (`content/chapters/` is empty); the PDF starts at the first page.
2. **Composition** — `src/layouts/WorkbookPage.tsx` renders five variants: `case`, `profile`, `trajectory`, `matrix`, `process`. `src/layouts/RoteiroPage.tsx` renders the `roteiro` variant. `src/layouts/CasoPage.tsx` renders the `caso` variant. `src/layouts/CronogramaPage.tsx` renders the `cronograma` variant. `src/layouts/VersoPage.tsx` renders the `verso` page. The schema is `src/content/schema.ts`.
3. **Output** — `src/lib/paginateDesk.ts` prints the sheets. Workshop, roteiro, caso, cronograma, and verso pages are fixed (`data-paginate="off"`) and are not split. `scripts/build-pdf.ts` builds and prints with Playwright.

A flow section (MDX) uses `.page-frame` / `.page-body` and can paginate. A workbook section uses `.wb-page` and must fit one sheet. A roteiro section uses `.rt-page` and must fit one sheet. A caso section uses `.cs-page` and must fit one sheet. A cronograma section uses `.cr-page` and must fit one sheet. A verso section uses `.vs-page` and fills one sheet. Do not mix the six.

The preview switches documents at runtime: `?doc=experiencias` loads the interview scripts, `?doc=casos` loads the case studies, `?doc=cronograma` loads the schedule cards; the default loads the workshop workbook.

## Page invariants

The default page is 297 × 210 mm. The case studies override it to 210 × 297 mm through `src/styles/caso.css` (`:root[data-orientation="portrait"]`), set by `DocumentShell` before the paginator measures the content.

Changing the landscape geometry means changing, together:

- `src/styles/tokens.css` (`--page-width`, `--page-height`, margins, type sizes);
- `src/styles/paged.css` (literal `size: 297mm 210mm`);
- `src/styles/print.css` (literal `size: 303mm 216mm`, `--bleed: 3mm`);
- `scripts/build-pdf.ts` (`geometry.digital`, `geometry.print`, viewport, print override);
- `scripts/validate-document.ts` (asserts the landscape literals).

The portrait case studies keep the same trim and bleed logic: digital 210 × 297 mm; print 216 × 303 mm. `caso.css` assigns the named page `caso`; `digital.css` and `print.css` declare its size for direct browser printing, and `scripts/validate-document.ts` asserts the portrait literals.

Digital trim is A4. Print adds 3 mm bleed on every edge. No crop marks, no CMYK conversion, no ICC profile, no PDF/X.

## Workbook content

- `content/workbook/<slug>.json` must match one variant in `src/content/schema.ts`.
- `case`: fields + decision + orientation.
- `profile`: empathy map (6 zones) + training (2+ fields) + orientation.
- `trajectory`: 3 stages + 3 rows + orientation.
- `matrix`: 3 cells + note + orientation.
- `process`: 3 columns + orientation.
- Every workshop has a `header` (`eyebrow`, `title`, `subtitle`, optional `fields`), a `rail` with `intro` and ordered `steps`, and an `orientation`.
- `number` is the panel number, `time` is the printed duration. Keep both consistent with the rail.
- Text is transcribed from `consec_origin.pdf`. Do not “improve” wording without asking; it is an editorial document.

## Roteiro content

- `content/roteiros/<slug>.json` matches the `roteiro` variant: `number`, `axis`, `city`, `guests[]`, `opening`, `questions[]`.
- Each question has `number`, `text`, and an optional `followUp` (`label` + `items[]`). The `marker` is printed as it appears in the source (`a)`, `b)`, and even the isolated `c)` on Manaus).
- The only printed labels are `ABERTURA` and `PERGUNTAS`, both from the source. Do not add editorial copy, calls to action, or a cover.
- One fixed A4 landscape sheet per guest; the roteiros are not split by the paginator.
- Roteiros use 20 mm side margins (the workbook uses 12 mm). This shortens the question measure and keeps the digital and print profiles identical; do not change it without rechecking page 1.
- The header keeps the number and axis on the left and the city/guests on the right. Long axes wrap to two lines; that is expected.
- Text is transcribed from the editor's PDF (`_entrada/conteudo/experiencias-redes-ensino.pdf`). Keep names, roles, questions, and punctuation verbatim.

### A5 legibility

The interview scripts are printed at A5 landscape (A4 reduced to 70.7%). Their type is deliberately larger than the workbook's:

- body/questions 11.5 pt → ~8.1 pt at A5;
- opening lead 14 pt → ~9.9 pt at A5;
- title 30 pt → ~21 pt at A5.

If a roteiro page is tight, adjust spacing or ask the editor to cut text; do not take the body below 11.5 pt. Do not copy the workbook's 6–8 pt settings into `roteiro.css`.

## Cronograma content (Minuto a minuto)

- `content/cronograma/<slug>.json` matches the `cronograma` variant: `day`, `part`, `weekday`, `date` and `entries[]`. It is the printed programme of the two meeting days.
- Six fixed cards: `dia-1-1` (morning), `dia-1-2` (mid-day), `dia-1-3` (afternoon), `dia-2-1` (morning), `dia-2-2` (mid-day) and `dia-2-3` (afternoon). Both days need three fichas because of the MC cues: Day 1 breaks at the two pauses, Day 2 at the morning pause and at the coffee pause.
- A timed entry (`kind` `abertura`, `mesa`, `oficina`, `pausa`, `encerramento`, `sessao`) has `start`, `end`, `duration` (minutes, as in the source plan), `title`, and optionally `label` (e.g. `Mesa 2 com Rio de Janeiro`), `method` (`Jornada do usuário`), `subtitle`, `description`, `intro`, `items`, `paragraphs`, `host` (quem conduz), `note` (observações) and `tone: "mc"`.
- An MC entry is `{ "kind": "mc", "text": "Carol volta ao mic…" }`: a stage direction between blocks, with no time. It is printed as a light purple band (`#d9d2e9`), exactly like the purple rows of the source sheet. The Boas-vindas row also carries `tone: "mc"` because it is highlighted in the source.
- Text is transcribed from the editor's `[VF]` PDF pages (`_entrada/conteudo/planejamento-tempos-e-movimentos-dia-1.pdf` and `planejamento-tempos-e-movimentos-dia-2.pdf`); the HTML pages and the CSVs are earlier versions and lack several Day 2 MC cues. Keep names, times and wording verbatim. Where the source says `Definir.` for quem conduz, the card prints `A definir`.
- A timed entry may carry `supplies`: its own insumos (`Slides.`, `Roteiro.`), printed as a small line inside that time slot, above the note. `Observações` is a small italic line; `host` sits at the right of the entry title. Pauses are plain rows, not filled bands.
- The card is drawn on the A4 landscape canvas (20 mm side margins, like the roteiros) and reduced to A5 (70,7%) by `scripts/impose-a5.ts`. Body is 9.8 pt on the canvas → ~6,9 pt at A5; do not take it below 9.6 pt.
- `npm run gerar-pdf-cronograma-a5` exports `output/cronograma-digital.pdf` and imposes `output/cronograma-a5-frente.pdf`: two A5 cards per A4 portrait sheet, with cut marks (6 cards → 4 sheets; sheets 2 and 4 carry one card each and leave the lower half white). Pass `--sem-verso` to the imposition and `--quebra=3` to start a new sheet after the third card, keeping Day 1 and Day 2 apart; without it the script treats the last page as a back art and drops a card.

## Verso (Experiências)

- The back page is a document page, not a separate cover: `content/verso/experiencias.json` (`variant: "verso"`) is the last section of `content/document-experiencias.json`, so the preview, the PDF, and the A5 imposition all include it.
- `src/layouts/VersoPage.tsx` renders it with `.vs-*` classes in `src/styles/verso.css`: `#493975` ground, the Vozes grafismos in `#8146cb`, and the official white Vozes signature centred and large. No text, no TumTum logo, no folio.
- `src/assets/verso/vozes-assinatura-branca.svg` is the official signature in white (vector). `src/assets/verso/vozes-grafismo.png` is generated from page 2 of `_entrada/marca/vozes-grafismos.ai`, recolored to `#8146cb` on transparency. Re-render if the AI changes.
- In the print profile the purple extends by `--bleed` (3 mm) beyond the trim; in the digital profile it stops at the trim.
- The page is fixed (`data-paginate="off"`, `data-folio="off"`); do not let it paginate.
- A5 duplex (`scripts/impose-a5.ts`): the verso is one continuous A4 artwork, so the pattern crosses the cut with no seam; `scripts/verso/duplex.html` renders it with one logo at each card centre; `scripts/build-verso-duplex.ts` produces `experiencias-verso-duplex-2.pdf` (two cards) and `experiencias-verso-duplex-1.pdf` (one card, lower half white). The imposition interleaves front and back (`f1, v1, f2, v2, f3, v3`); print duplex with the long-edge flip. The last sheet carries one card and leaves the lower half white.
- Cut marks appear only on the front, at the horizontal midline, as crosses (horizontal + vertical) whose intersection sits exactly on the cut line, 5 mm from the side edge. The back stays clean.
- The front keeps its content inside 20 mm side and 11 mm top/bottom margins (A4 design), so the 5 mm printer margin falls in white. The purple back reaches the sheet edge; full bleed needs a print shop, while an office printer leaves a white border.

## Caso content

- `content/casos/<slug>.json` matches the `caso` variant: `number`, `axis`, `title`, `descriptor`, `lead[]`, `sections[]` (`title` + `paragraphs[]`) and `decision`.
- One fixed A4 portrait sheet per case; the paginator does not split it. Each case is a reading text, not a worksheet: there are no blank answer areas.
- The case sheet has **no running head**. The footer carries the material descriptor (`masthead.footer`), the meeting line (`masthead.note`) and the page number, all from `content/document-casos.json`. The page number is computed from the section order.
- **No copy, title, or label may be added.** The footer uses only the source's descriptor and meeting line; the institutional header line is omitted rather than repeated. The CONSED mark sits at the left of the footer, at the editor's request, exactly as on the roteiros.
- `lead` is set in one column at 11.2 pt; `sections.paragraphs` run in two columns at 9.8 pt. The decision panel closes the text and is not anchored to the bottom.
- Text is transcribed from the editor's PDF (`CONSEC – Estudos de caso Governança e Infraestrutura`). Keep names, figures, questions, and punctuation verbatim; the extracted text contains broken words such as “pr ofessores”, which must be joined.
- Four cases fit on one sheet each. If a case grows, adjust `caso.css` or ask for a text cut; do not reduce the body below 9.4 pt or let the sheet overflow.

## Apresentação (deck .pptx)

- `content/apresentacao/formacao-ia.json` is the manifest of the **slide deck** `Formação IA` (38 slides, 16:9). It is not a document of the editorial pipeline: there is no HTML composition and no PDF product. The `.pptx` is the master.
- The master lives at `_entrada/conteudo/formacao-ia.pptx` and is never edited. Edits are declarative, in `content/apresentacao/formacao-ia.edits.json` (`slide`, `find`, `replace`, optional `occurrence`/`comment`). `npm run apresentacao:montar` applies them and writes `output/formacao-ia.pptx`.
- Editing happens inside the OOXML: only the `<a:t>` runs of the requested slides are rewritten, so masters, layouts, images, notes, animation and untouched slides stay byte-identical. The build prints a hash diff; a no-edit build must report `230 de 230` intact parts.
- A `find` string that spans runs is only merged when every touched run shares the same `<a:rPr>`; otherwise the edit fails with `spans-runs` and must be resolved by hand. Never flatten mixed formatting.
- `npm run apresentacao:previa` renders the deck with LibreOffice into `output/formacao-ia/previa/` (PDF + one PNG per slide + `index.html` contact sheet). Slide 38 is hidden (`show="0"`), so the preview has 37 pages.
- The preview is only truthful with **Instrument Sans installed** in `~/Library/Fonts` (`Instrument Sans`, `Instrument Sans Medium`, `Instrument Sans SemiBold`, each Regular/Italic/Bold/BoldItalic, generated from the Google Fonts variable font). The `render.ts` script points `FONTCONFIG_FILE` at `scripts/pptx/fonts.conf`, because the fontconfig bundled with LibreOffice does not read the macOS font folders; without both, every slide falls back to a serif and the proof lies about typography.
- Do not record any visual decision from a render that warns about the missing font. LibreOffice also differs from PowerPoint in autofit and in some shape effects; treat the PNG as a proof of typography and composition, not of PowerPoint's exact raster.
- Do not rebuild these slides in React. A new deck that must return as `.pptx` keeps PowerPoint as the source of truth; the Vite site has no route for it.
- Prefer text edits. A slide that needs a new diagram is designed as native pptx shapes, not pasted as a picture, unless the editor accepts losing editable text.

## Identity

- Font: Instrument Sans via `@fontsource/instrument-sans` (400/500/600/700).
- Palette: `#0b5384` (text/headings), `#64e15e` (accent), plus the graphic palette in `tokens.css`.
- The CONSED mark is a **provisional SVG reconstruction**. Do not present it as the official logo. Replace it when the vector file arrives.
- The partner logos are typeset text. Replace them when vectors arrive.
- Title and subtitle are working titles. Confirm before publishing.
- Empty boxes are print-only. Do not add form inputs unless the editor asks.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` / `visualizar` / `editar` | Vite site at http://127.0.0.1:5173 |
| `npm run build` / `gerar-pdf` | Validate, build, print `output/document-digital.pdf` |
| `npm run pdf:print` / `gerar-pdf-grafica` | Print `output/document-print.pdf` with bleed |
| `npm run gerar-pdf-experiencias` | Print `output/experiencias-digital.pdf` |
| `npm run gerar-pdf-grafica-experiencias` | Print `output/experiencias-print.pdf` with bleed |
| `npm run gerar-pdf-experiencias-a5` | Print and impose `output/experiencias-a5-duplex.pdf` (front/back, 2 A5 cards per A4) |
| `npm run gerar-pdf-experiencias-frente` | Print and impose only the fronts into `output/experiencias-a5-frente.pdf` |
| `npm run gerar-verso-duplex` | Render the continuous A4 backs (two cards and one card) |
| `npm run gerar-pdf-casos` | Print `output/casos-digital.pdf` (A4 portrait) |
| `npm run gerar-pdf-grafica-casos` | Print `output/casos-print.pdf` with bleed (216 × 303 mm) |
| `npm run gerar-pdf-cronograma` | Print `output/cronograma-digital.pdf` (A4 landscape canvas) |
| `npm run gerar-pdf-grafica-cronograma` | Print `output/cronograma-print.pdf` with bleed |
| `npm run gerar-pdf-cronograma-a5` | Print and impose `output/cronograma-a5-frente.pdf` (6 fichas A5, 2 per A4 sheet) |
| `npm run impor-cronograma` | Re-impose the existing `cronograma-digital.pdf` into A5 fichas |
| `npm run apresentacao:abrir` | Inventory the deck: text, shapes, notes and review comments per slide |
| `npm run apresentacao:montar` | Apply `formacao-ia.edits.json` and write `output/formacao-ia.pptx` |
| `npm run apresentacao:previa` | Render the deck to PDF + PNG per slide + contact sheet |
| `npm run apresentacao:conferir` | `apresentacao:montar` then `apresentacao:previa` |
| `npm run validate` | All four manifests, workbook/roteiro/caso/cronograma JSON, MDX, assets, geometry |
| `npm run check` | `validate` plus TypeScript |
| `npm run test:visual` | Playwright against the Vite site |

## When you change something

1. If a workshop grows, rebalance the panel grid in `workbook.css`; do not turn it into a flow page.
2. If a roteiro grows, rebalance `roteiro.css` or ask for a text cut. Keep the body at 11.5 pt or larger for A5.
3. If a caso grows, rebalance `caso.css` or ask for a text cut. The sheet is portrait and fixed; keep the two-column body and the decision panel on the same page.
4. If a cronograma grows, rebalance `cronograma.css` or ask for a text cut. Keep the four cards and the lunch split; do not take the body below 9.6 pt on the A4 canvas.
5. Look at the affected sheet in the Vite preview at full size. Check the rail/header, the body, and the footer. Use `?doc=experiencias` for the interview scripts, `?doc=casos` for the case studies and `?doc=cronograma` for the schedule cards.
6. Run PDF export only when asked. If you run it, do not claim success without exit 0, page count, and media box.
7. Do not commit generated `output/*.pdf`. `output/` is gitignored except `.gitkeep`.
8. New source material goes in `_entrada/` (gitignored) following `docs/ENTRADA-DE-ARQUIVOS.md`.
