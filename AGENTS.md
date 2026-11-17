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

1. **Content** — each document has its own reading order. `content/document.json` lists the ten workshop sheets in `content/workbook/`; `content/document-experiencias.json` lists the five interview scripts in `content/roteiros/` and the purple back page in `content/verso/`; `content/document-casos.json` lists the four case studies in `content/casos/`. The project has no cover page (`content/chapters/` is empty); the PDF starts at the first page.
2. **Composition** — `src/layouts/WorkbookPage.tsx` renders five variants: `case`, `profile`, `trajectory`, `matrix`, `process`. `src/layouts/RoteiroPage.tsx` renders the `roteiro` variant. `src/layouts/CasoPage.tsx` renders the `caso` variant. `src/layouts/VersoPage.tsx` renders the `verso` page. The schema is `src/content/schema.ts`.
3. **Output** — `src/lib/paginateDesk.ts` prints the sheets. Workshop, roteiro, caso, and verso pages are fixed (`data-paginate="off"`) and are not split. `scripts/build-pdf.ts` builds and prints with Playwright.

A flow section (MDX) uses `.page-frame` / `.page-body` and can paginate. A workbook section uses `.wb-page` and must fit one sheet. A roteiro section uses `.rt-page` and must fit one sheet. A caso section uses `.cs-page` and must fit one sheet. A verso section uses `.vs-page` and fills one sheet. Do not mix the five.

The preview switches documents at runtime: `?doc=experiencias` loads the interview scripts, `?doc=casos` loads the case studies; the default loads the workshop workbook.

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

## Verso (Experiências)

- The back page is a document page, not a separate cover: `content/verso/experiencias.json` (`variant: "verso"`) is the last section of `content/document-experiencias.json`, so the preview, the PDF, and the A5 imposition all include it.
- `src/layouts/VersoPage.tsx` renders it with `.vs-*` classes in `src/styles/verso.css`: `#493975` ground, the Vozes grafismos in `#8146cb`, and the official white Vozes signature centred and large. No text, no TumTum logo, no folio.
- `src/assets/verso/vozes-assinatura-branca.svg` is the official signature in white (vector). `src/assets/verso/vozes-grafismo.png` is generated from page 2 of `_entrada/marca/vozes-grafismos.ai`, recolored to `#8146cb` on transparency. Re-render if the AI changes.
- In the print profile the purple extends by `--bleed` (3 mm) beyond the trim; in the digital profile it stops at the trim.
- The page is fixed (`data-paginate="off"`, `data-folio="off"`); do not let it paginate.
- Printer margin: the roteiro sheets have 20 mm side margins, so a 5 mm unprintable border falls in white and cuts no text. The purple runs to the edge, so full-bleed requires a print shop; an office printer leaves a white border.

## Caso content

- `content/casos/<slug>.json` matches the `caso` variant: `number`, `axis`, `title`, `descriptor`, `lead[]`, `sections[]` (`title` + `paragraphs[]`) and `decision`.
- One fixed A4 portrait sheet per case; the paginator does not split it. Each case is a reading text, not a worksheet: there are no blank answer areas.
- The case sheet has **no running head**. The footer carries the material descriptor (`masthead.footer`), the meeting line (`masthead.note`) and the page number, all from `content/document-casos.json`. The page number is computed from the section order.
- **No copy, title, or label may be added.** The footer uses only the source's descriptor and meeting line; the institutional header line is omitted rather than repeated. The CONSED mark sits at the left of the footer, at the editor's request, exactly as on the roteiros.
- `lead` is set in one column at 11.2 pt; `sections.paragraphs` run in two columns at 9.8 pt. The decision panel closes the text and is not anchored to the bottom.
- Text is transcribed from the editor's PDF (`CONSEC – Estudos de caso Governança e Infraestrutura`). Keep names, figures, questions, and punctuation verbatim; the extracted text contains broken words such as “pr ofessores”, which must be joined.
- Four cases fit on one sheet each. If a case grows, adjust `caso.css` or ask for a text cut; do not reduce the body below 9.4 pt or let the sheet overflow.

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
| `npm run gerar-pdf-experiencias-a5` | Print and impose `output/experiencias-a5-2up.pdf` (2 A5 per A4, verso included) |
| `npm run gerar-pdf-casos` | Print `output/casos-digital.pdf` (A4 portrait) |
| `npm run gerar-pdf-grafica-casos` | Print `output/casos-print.pdf` with bleed (216 × 303 mm) |
| `npm run validate` | All three manifests, workbook/roteiro/caso JSON, MDX, assets, geometry |
| `npm run check` | `validate` plus TypeScript |
| `npm run test:visual` | Playwright against the Vite site |

## When you change something

1. If a workshop grows, rebalance the panel grid in `workbook.css`; do not turn it into a flow page.
2. If a roteiro grows, rebalance `roteiro.css` or ask for a text cut. Keep the body at 11.5 pt or larger for A5.
3. If a caso grows, rebalance `caso.css` or ask for a text cut. The sheet is portrait and fixed; keep the two-column body and the decision panel on the same page.
4. Look at the affected sheet in the Vite preview at full size. Check the rail/header, the body, and the footer. Use `?doc=experiencias` for the interview scripts and `?doc=casos` for the case studies.
5. Run PDF export only when asked. If you run it, do not claim success without exit 0, page count, and media box.
6. Do not commit generated `output/*.pdf`. `output/` is gitignored except `.gitkeep`.
7. New source material goes in `_entrada/` (gitignored) following `docs/ENTRADA-DE-ARQUIVOS.md`.
