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

test('the interview scripts render as five sheets plus the purple back page', async ({ page }) => {
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
        layout: node.getAttribute('data-layout') ?? '',
      }
    }),
  )

  expect(sheets).toHaveLength(6)
  expect(sheets.every((sheet) => sheet.landscape)).toBe(true)
  expect(sheets.slice(0, 5).every((sheet) => sheet.free >= 0)).toBe(true)
  expect(sheets[5]?.layout).toBe('verso')
  expect(sheets.slice(0, 5).map((sheet) => sheet.label)).toEqual([
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

test('the case studies render as four A4 portrait sheets', async ({ page }) => {
  const pageErrors: string[] = []
  const failed: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`)
  })

  await page.goto('/?doc=casos')
  await page.waitForFunction(() => document.documentElement.dataset.pagesReady === '1')

  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  await expect(page.locator('html')).toHaveAttribute('data-orientation', 'portrait')
  await expect(page.locator('.preview-banner')).toContainText('A4 retrato')

  const sheets = await page.locator('.desk .sheet').evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect()
      const pageEl = node.querySelector('.cs-page')
      return {
        portrait: box.height > box.width,
        overflow: pageEl ? pageEl.scrollHeight - pageEl.clientHeight : -1,
        title: node.querySelector('.cs-title')?.textContent ?? '',
        badge: node.querySelector('.cs-badge')?.textContent ?? '',
        folio: node.querySelector('.cs-footer-page')?.textContent ?? '',
      }
    }),
  )

  expect(sheets).toHaveLength(4)
  expect(sheets.every((sheet) => sheet.portrait)).toBe(true)
  expect(sheets.every((sheet) => sheet.overflow <= 1)).toBe(true)
  expect(sheets.map((sheet) => sheet.title)).toEqual([
    'Capital A',
    'Capital B',
    'Capital C',
    'Capital D',
  ])
  expect(sheets.map((sheet) => sheet.badge)).toEqual(['CASO 1A', 'CASO 1B', 'CASO 5A', 'CASO 5B'])
  expect(sheets.map((sheet) => sheet.folio.replace(/\s+/g, ' '))).toEqual([
    '1 de 4',
    '2 de 4',
    '3 de 4',
    '4 de 4',
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

test('the schedule renders as four fixed cards, two per day', async ({ page }) => {
  const pageErrors: string[] = []
  const failed: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`)
  })

  await page.goto('/?doc=cronograma')
  await page.waitForFunction(() => document.documentElement.dataset.pagesReady === '1')

  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  await expect(page.locator('.preview-banner')).toContainText('duas fichas A5 por dia')

  const sheets = await page.locator('.desk .sheet').evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect()
      const pageEl = node.querySelector('.cr-page')
      return {
        landscape: box.width > box.height,
        overflow: pageEl ? pageEl.scrollHeight - pageEl.clientHeight : -1,
        layout: node.getAttribute('data-layout') ?? '',
        day: node.querySelector('.cr-day')?.textContent ?? '',
        part: node.querySelector('.cr-title')?.textContent ?? '',
        entries: node.querySelectorAll('.cr-entry').length,
      }
    }),
  )

  expect(sheets).toHaveLength(4)
  expect(sheets.every((sheet) => sheet.landscape)).toBe(true)
  expect(sheets.every((sheet) => sheet.layout === 'cronograma')).toBe(true)
  expect(sheets.every((sheet) => sheet.overflow <= 2)).toBe(true)
  expect(sheets.map((sheet) => sheet.day)).toEqual(['D1', 'D1', 'D2', 'D2'])
  expect(sheets.map((sheet) => sheet.part)).toEqual(['MANHÃ', 'TARDE', 'MANHÃ', 'TARDE'])
  expect(sheets.map((sheet) => sheet.entries)).toEqual([8, 6, 6, 6])

  const broken = await page.evaluate(() =>
    [...document.querySelectorAll('img')]
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.getAttribute('src')),
  )
  expect(broken).toEqual([])
  expect(pageErrors).toEqual([])
  expect(failed).toEqual([])
})
