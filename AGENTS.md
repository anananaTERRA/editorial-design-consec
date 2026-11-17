# Agent notes

This repository builds the CONSED workshop workbook as a React site (Vite) and exports a PDF by printing that site with Chromium. The page is **A4 landscape**. Read this file before changing the pipeline, the page models, or the content.

## Operational workflow

- Work in the Vite preview (`npm run dev` / `visualizar`, http://127.0.0.1:5173). The site is the proof.
- Do **not** auto-run `validate`, `build`, `gerar-pdf`, or any PDF command when finishing a task. The team runs those manually.
- During a **text-cut round**, change copy only. Do not fill empty space, change panel heights, or reflow a workshop onto another page unless the editor asks.
- Preserve every editor-agreed treatment (components, layout classes, CSS, assets) until they ask to change it.
- Human editors are non-technical. `docs/EDITAR-COM-AGENTE.md` gives examples in natural Portuguese.

## Architecture

Three layers stay separate:

1. **Content** — `content/document.json` is the only reading order. The ten workshop sheets are JSON in `content/workbook/`. The project has no cover page (`content/chapters/` is empty); the PDF starts at the first workshop.
2. **Composition** — `src/layouts/WorkbookPage.tsx` renders five variants: `case`, `profile`, `trajectory`, `matrix`, `process`. The schema is `src/content/schema.ts`.
3. **Output** — `src/lib/paginateDesk.ts` prints the sheets. Workshop pages are fixed (`data-paginate="off"`) and are not split. `scripts/build-pdf.ts` builds and prints with Playwright.

A flow section (MDX) uses `.page-frame` / `.page-body` and can paginate. A workbook section uses `.wb-page` and must fit one sheet. Do not mix the two.

## Page invariants

The page is 297 × 210 mm. Changing geometry means changing, together:

- `src/styles/tokens.css` (`--page-width`, `--page-height`, margins, type sizes);
- `src/styles/paged.css` (literal `size: 297mm 210mm`);
- `src/styles/print.css` (literal `size: 303mm 216mm`, `--bleed: 3mm`);
- `scripts/build-pdf.ts` (`geometry.digital`, `geometry.print`, viewport, print override);
- `scripts/validate-document.ts` (asserts the landscape literals).

Digital trim is A4 landscape. Print adds 3 mm bleed on every edge. No crop marks, no CMYK conversion, no ICC profile, no PDF/X.

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
| `npm run validate` | Manifest, workbook JSON, MDX, assets, geometry |
| `npm run check` | `validate` plus TypeScript |
| `npm run test:visual` | Playwright against the Vite site |

## When you change something

1. If a workshop grows, rebalance the panel grid in `workbook.css`; do not turn it into a flow page.
2. Look at the affected sheet in the Vite preview at full size. Check the rail, the panel body, and the footer.
3. Run PDF export only when asked. If you run it, do not claim success without exit 0, page count, and media box.
4. Do not commit generated `output/*.pdf`. `output/` is gitignored except `.gitkeep`.
5. New source material goes in `_entrada/` (gitignored) following `docs/ENTRADA-DE-ARQUIVOS.md`.
