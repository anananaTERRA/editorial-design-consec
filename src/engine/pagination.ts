/**
 * The document is a React site. PDF export prints that site.
 * Replace this descriptor together with scripts/build-pdf.ts if the exporter changes.
 */
export const paginationEngine = {
  id: 'chromium-print',
  packageName: '@playwright/test',
  digitalCommand: 'npm run build',
  printCommand: 'npm run pdf:print',
  limitations: [
    'Screen preview is the Vite site. There is no separate paginated viewer.',
    'The page is A4 landscape: 297 mm wide by 210 mm tall.',
    'Digital and print PDFs are Chromium prints of that site (Playwright page.pdf).',
    'Page numbers sit on the outer edge of each sheet.',
    'The print PDF enlarges the media box by the bleed in src/styles/print.css. It does not draw crop marks, convert RGB to CMYK, embed an ICC profile, or run PDF/X preflight.',
  ],
} as const
