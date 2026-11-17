import { expect, test } from '@playwright/test'

test('the workbook renders as A4 landscape sheets', async ({ page }) => {
  const pageErrors: string[] = []
  const failed: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`)
  })

  await page.goto('/')
  await page.waitForFunction(() => document.documentElement.dataset.pagesReady === '1')

  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  await expect(page.locator('html')).toHaveAttribute('data-profile', 'screen')
  await expect(page.locator('.desk')).toHaveAttribute('data-pagination-engine', 'chromium-print')
  await expect(page.locator('.preview-banner')).toContainText('A4 paisagem')
  await expect(page.locator('.desk .sheet').first()).toBeVisible()

  const sheets = await page.locator('.desk .sheet').evaluateAll((nodes) => {
    const boxes = nodes.map((node) => {
      const box = node.getBoundingClientRect()
      return { width: Math.round(box.width), height: Math.round(box.height) }
    })
    return {
      count: boxes.length,
      landscape: boxes.every((box) => box.width > box.height),
      widths: [...new Set(boxes.map((box) => box.width))],
      heights: [...new Set(boxes.map((box) => box.height))],
      workbookPages: document.querySelectorAll('.desk .layout-workbook').length,
    }
  })

  expect(sheets.count).toBe(10)
  expect(sheets.workbookPages).toBe(10)
  expect(sheets.landscape).toBe(true)
  expect(sheets.widths).toEqual([sheets.widths[0]])
  expect(sheets.heights).toEqual([sheets.heights[0]])

  const broken = await page.evaluate(() =>
    [...document.querySelectorAll('img')]
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.getAttribute('src')),
  )
  expect(broken).toEqual([])
  expect(pageErrors).toEqual([])
  expect(failed).toEqual([])
})

test('the interview scripts render as five A4 landscape sheets', async ({ page }) => {
  const pageErrors: string[] = []
  const failed: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`)
  })

  await page.goto('/?doc=experiencias')
  await page.waitForFunction(() => document.documentElement.dataset.pagesReady === '1')

  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  await expect(page.locator('.preview-banner')).toContainText('A5 paisagem')

  const sheets = await page.locator('.desk .sheet').evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect()
      const footer = node.querySelector('.rt-footer')
      const lastQuestion = [...node.querySelectorAll('.rt-question')].pop()
      const free =
        footer && lastQuestion
          ? footer.getBoundingClientRect().top - lastQuestion.getBoundingClientRect().bottom
          : -1
      return {
        landscape: box.width > box.height,
        free,
        label: node.querySelector('.rt-title')?.textContent ?? '',
      }
    }),
  )

  expect(sheets).toHaveLength(5)
  expect(sheets.every((sheet) => sheet.landscape)).toBe(true)
  expect(sheets.every((sheet) => sheet.free >= 0)).toBe(true)
  expect(sheets.map((sheet) => sheet.label)).toEqual([
    'GOVERNANÇA',
    'FORMAÇÃO',
    'IA NO ENSINO E NA APRENDIZAGEM',
    'GESTÃO EDUCACIONAL COM IA',
    'INFRAESTRUTURA E SEGURANÇA',
  ])

  const broken = await page.evaluate(() =>
    [...document.querySelectorAll('img')]
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.getAttribute('src')),
  )
  expect(broken).toEqual([])
  expect(pageErrors).toEqual([])
  expect(failed).toEqual([])
})
