/**
 * Splits each section into A4 landscape pages for the on-screen desk.
 * The PDF prints those same pages, so the preview and the file match.
 */

const SLOP = 4

/** Blocks that are never cut across pages. */
const ATOMIC = [
  '.figure',
  '.editorial-table',
  '.pull-quote',
  '.highlight',
  '.text-columns',
  '.keep-together',
  'table',
].join(', ')

export function paginateInto(source: HTMLElement, desk: HTMLElement): () => void {
  let cancelled = false

  const run = () => {
    if (cancelled) return
    const sheets = [...source.children].filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement && node.classList.contains('sheet'),
    )
    const pages: HTMLElement[] = []
    let pageNumber = 1
    for (const sheet of sheets) {
      const built = paginateSheet(sheet, pageNumber)
      pages.push(...built)
      pageNumber += built.length
    }
    desk.replaceChildren(...pages.map(wrapPage))
    document.documentElement.dataset.pagesReady = '1'
    document.documentElement.dataset.pageCount = String(pages.length)
  }

  void (async () => {
    await document.fonts.ready
    const images = [...source.querySelectorAll('img')]
    await Promise.all(
      images.map((img) => (img.decode ? img.decode().catch(() => undefined) : Promise.resolve())),
    )
    run()
  })()

  return () => {
    cancelled = true
    delete document.documentElement.dataset.pagesReady
    delete document.documentElement.dataset.pageCount
  }
}

function paginateSheet(sheet: HTMLElement, startPage: number): HTMLElement[] {
  if (sheet.dataset.paginate === 'off') {
    return [cloneWhole(sheet, startPage)]
  }
  const limit = pageLimitPx()
  const body = sheet.querySelector(':scope > .page-frame > .page-body')
  if (!(body instanceof HTMLElement)) {
    return [cloneWhole(sheet, startPage)]
  }

  const blocks = elementChildren(body).map((node) => node.cloneNode(true) as HTMLElement)
  if (blocks.length === 0) {
    return [cloneWhole(sheet, startPage)]
  }

  const hasHeader = Boolean(sheet.querySelector(':scope > .page-frame > .page-header'))
  const probe = createProbe(sheet)

  try {
    if (probe.measure(blocks, hasHeader) <= limit + SLOP) {
      return [cloneWhole(sheet, startPage)]
    }
    const groups = groupBlocks(blocks, limit, probe.measure, hasHeader)
    return groups.map((nodes, index) =>
      renderGroup(sheet, nodes, startPage + index, hasHeader && index === 0),
    )
  } finally {
    probe.destroy()
  }
}

function groupBlocks(
  blocks: HTMLElement[],
  limit: number,
  measure: (nodes: HTMLElement[], withHeader: boolean) => number,
  hasHeader: boolean,
): HTMLElement[][] {
  const queue = blocks.filter((block) => !isSkippable(block))
  const groups: HTMLElement[][] = []
  let current: HTMLElement[] = []
  let guard = 0

  const isFirstPage = () => groups.length === 0
  const fits = (nodes: HTMLElement[]) =>
    measure(nodes, hasHeader && isFirstPage()) <= limit + SLOP

  while (queue.length > 0 && guard++ < 4000) {
    const block = queue.shift()
    if (!block) break
    const next = queue[0]

    if (isHeading(block) && next && current.length > 0 && !fits([...current, block, next])) {
      groups.push(current)
      current = []
      queue.unshift(block)
      continue
    }

    if (current.length > 0 && !fits([...current, block])) {
      groups.push(current)
      current = []
      queue.unshift(block)
      continue
    }

    if (current.length === 0 && !fits([block])) {
      const parts = breakApart(block, limit, measure, hasHeader && isFirstPage())
      if (parts.length > 1) {
        queue.unshift(...parts)
        continue
      }
      groups.push([block])
      continue
    }

    current.push(block)
  }

  if (current.length > 0) groups.push(current)
  return groups.map(coalesceTables)
}

function breakApart(
  block: HTMLElement,
  limit: number,
  measure: (nodes: HTMLElement[], withHeader: boolean) => number,
  withHeader: boolean,
): HTMLElement[] {
  if (block.matches('.editorial-table')) return splitTable(block)
  if (block.matches(ATOMIC)) return [block]

  if (block.matches('ol, ul')) {
    const items = elementChildren(block)
    if (items.length <= 1) return [block]
    return items.map((item) => {
      const list = block.cloneNode(false) as HTMLElement
      list.appendChild(item.cloneNode(true))
      return list
    })
  }

  if (block.matches('p, li, blockquote')) {
    return splitText(block, limit, measure, withHeader)
  }

  const kids = elementChildren(block)
  if (kids.length > 1) return kids.map((kid) => kid.cloneNode(true) as HTMLElement)
  if (kids.length === 1) return [kids[0].cloneNode(true) as HTMLElement]
  return splitText(block, limit, measure, withHeader)
}

function splitTable(block: HTMLElement): HTMLElement[] {
  const table = block.querySelector('table')
  const rows = [...block.querySelectorAll('tbody > tr')]
  if (!table || rows.length <= 1) return [block]
  const head = table.querySelector('thead')
  return rows.map((row) => {
    const figure = block.cloneNode(false) as HTMLElement
    const next = table.cloneNode(false) as HTMLTableElement
    if (head) next.appendChild(head.cloneNode(true))
    const body = document.createElement('tbody')
    body.appendChild(row.cloneNode(true))
    next.appendChild(body)
    figure.appendChild(next)
    return figure
  })
}

function coalesceTables(nodes: HTMLElement[]): HTMLElement[] {
  const merged: HTMLElement[] = []
  for (const node of nodes) {
    const prev = merged[merged.length - 1]
    const row = node.matches('.editorial-table') ? node.querySelector('tbody > tr') : null
    const prevBody = prev?.matches('.editorial-table') ? prev.querySelector('tbody') : null
    if (prev && row && prevBody) {
      prevBody.appendChild(row)
      continue
    }
    merged.push(node)
  }
  return merged
}

function splitText(
  el: HTMLElement,
  limit: number,
  measure: (nodes: HTMLElement[], withHeader: boolean) => number,
  withHeader: boolean,
): HTMLElement[] {
  const total = el.textContent?.length ?? 0
  if (total < 80) return [el]

  const parts: HTMLElement[] = []
  let rest: HTMLElement | null = el
  let safety = 0
  while (rest && safety++ < 30) {
    if (measure([rest], withHeader) <= limit + SLOP) {
      parts.push(rest)
      break
    }
    const count = fitCount(rest, limit, measure, withHeader)
    const snapped = snapWhitespace(rest.textContent ?? '', snapOutsideAnchors(rest, count))
    if (snapped < 24) {
      parts.push(rest)
      break
    }
    const [head, tail] = divideText(rest, snapped)
    if (!tail.textContent?.trim()) {
      parts.push(head)
      break
    }
    parts.push(head)
    rest = tail
    withHeader = false
  }
  return parts.length > 0 ? parts : [el]
}

function fitCount(
  el: HTMLElement,
  limit: number,
  measure: (nodes: HTMLElement[], withHeader: boolean) => number,
  withHeader: boolean,
): number {
  const total = el.textContent?.length ?? 0
  let lo = 0
  let hi = total
  let best = 0
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const [head] = divideText(el, mid)
    if (measure([head], withHeader) <= limit + SLOP) {
      best = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return best
}

function divideText(el: HTMLElement, count: number): [HTMLElement, HTMLElement] {
  const head = el.cloneNode(true) as HTMLElement
  const tail = el.cloneNode(true) as HTMLElement
  const headTexts = textNodes(head)
  const tailTexts = textNodes(tail)
  let left = Math.max(0, count)
  for (let i = 0; i < headTexts.length; i++) {
    const data = headTexts[i].data
    if (left >= data.length) {
      tailTexts[i].data = ''
      left -= data.length
    } else if (left > 0) {
      headTexts[i].data = data.slice(0, left)
      tailTexts[i].data = data.slice(left).replace(/^\s+/, '')
      left = 0
    } else {
      headTexts[i].data = ''
    }
  }
  pruneEmpty(head)
  pruneEmpty(tail)
  return [head, tail]
}

function textNodes(root: HTMLElement): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  let current = walker.nextNode()
  while (current) {
    nodes.push(current as Text)
    current = walker.nextNode()
  }
  return nodes
}

function pruneEmpty(root: HTMLElement) {
  const elements = [...root.querySelectorAll('*')].reverse()
  for (const node of elements) {
    if (node.matches('img, svg, br')) continue
    if (node.querySelector('img, svg')) continue
    if (!node.textContent?.trim()) node.remove()
  }
}

function snapWhitespace(text: string, index: number): number {
  if (index <= 0) return 0
  const slice = text.slice(0, index)
  const space = Math.max(slice.lastIndexOf(' '), slice.lastIndexOf('\n'))
  if (space >= 24) return space
  return index
}

/** Keeps a link whole when a paragraph breaks across pages. */
function snapOutsideAnchors(root: HTMLElement, index: number): number {
  const total = root.textContent?.length ?? 0
  if (index <= 0 || index >= total) return index

  let pos = 0
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let current: Text | null = null

  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    const len = node.data.length
    const next = pos + len
    if (index <= next) {
      current = node
      break
    }
    pos = next
  }

  if (!current) return index

  let parent: Node | null = current.parentNode
  while (parent && (!(parent instanceof HTMLElement) || parent.tagName !== 'A')) {
    parent = parent.parentNode
  }
  if (!(parent instanceof HTMLElement) || parent.tagName !== 'A') return index

  let anchorStart = 0
  const anchorWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (anchorWalker.nextNode()) {
    const node = anchorWalker.currentNode as Text
    let p: Node | null = node.parentNode
    let inAnchor = false
    while (p) {
      if (p === parent) {
        inAnchor = true
        break
      }
      p = p.parentNode
    }
    if (inAnchor) break
    anchorStart += node.data.length
  }

  const anchorLen = parent.textContent?.length ?? 0
  const anchorEnd = anchorStart + anchorLen
  if (index <= anchorStart || index >= anchorEnd) return index

  const toStart = index - anchorStart
  const toEnd = anchorEnd - index
  const snapped = toStart <= toEnd ? anchorStart : anchorEnd
  return snapWhitespace(root.textContent ?? '', snapped)
}

function cloneWhole(sheet: HTMLElement, pageNumber: number): HTMLElement {
  const page = sheet.cloneNode(true) as HTMLElement
  page.removeAttribute('data-folio')
  if (sheet.getAttribute('data-folio') === 'off') page.setAttribute('data-folio', 'off')
  decorate(page, pageNumber, false)
  return page
}

function renderGroup(
  sheet: HTMLElement,
  nodes: HTMLElement[],
  pageNumber: number,
  withHeader: boolean,
): HTMLElement {
  const page = sheet.cloneNode(false) as HTMLElement
  page.removeAttribute('id')

  const frame = document.createElement('div')
  frame.className = 'page-frame'

  if (withHeader) {
    const header = sheet.querySelector(':scope > .page-frame > .page-header')
    if (header) frame.appendChild(header.cloneNode(true))
  }

  const body = document.createElement('div')
  body.className = 'page-body'
  nodes.forEach((node) => body.appendChild(node))
  frame.appendChild(body)
  page.appendChild(frame)

  decorate(page, pageNumber, true)
  return page
}

function wrapPage(page: HTMLElement): HTMLElement {
  const fit = document.createElement('div')
  fit.className = 'sheet-fit'
  const scale = document.createElement('div')
  scale.className = 'sheet-scale'
  scale.appendChild(page)
  fit.appendChild(scale)
  return fit
}

function decorate(page: HTMLElement, pageNumber: number, stripExistingFolio: boolean) {
  page.classList.add('sheet-page')
  page.id = `page-${pageNumber}`
  page.dataset.page = String(pageNumber)
  page.dataset.pageSide = pageNumber % 2 === 1 ? 'right' : 'left'

  if (page.getAttribute('data-folio') === 'off') return
  if (stripExistingFolio) {
    page.querySelectorAll(':scope > .folio').forEach((node) => node.remove())
  }
  if (page.querySelector(':scope > .folio')) return

  const folio = document.createElement('span')
  folio.className = 'folio'
  folio.textContent = String(pageNumber)
  page.appendChild(folio)
}

type Probe = {
  measure: (nodes: HTMLElement[], withHeader: boolean) => number
  destroy: () => void
}

function createProbe(sheet: HTMLElement): Probe {
  const probe = sheet.cloneNode(false) as HTMLElement
  probe.removeAttribute('id')
  probe.style.position = 'absolute'
  probe.style.left = '-20000px'
  probe.style.top = '0'
  probe.style.margin = '0'
  probe.style.minHeight = '0'
  probe.style.height = 'auto'
  probe.style.maxHeight = 'none'
  probe.style.overflow = 'visible'
  probe.style.boxShadow = 'none'
  probe.style.visibility = 'hidden'
  probe.style.pointerEvents = 'none'

  const frame = document.createElement('div')
  frame.className = 'page-frame'
  frame.style.height = 'auto'
  /* In an auto-height flex frame, flex:1 can collapse to zero and skew the measurement. */
  frame.style.display = 'block'
  probe.appendChild(frame)
  document.body.appendChild(probe)

  const header = sheet.querySelector(':scope > .page-frame > .page-header')

  return {
    measure(nodes, withHeader) {
      frame.replaceChildren()
      if (withHeader && header) frame.appendChild(header.cloneNode(true))
      const body = document.createElement('div')
      body.className = 'page-body'
      body.style.flex = 'none'
      body.style.minHeight = '0'
      nodes.forEach((node) => body.appendChild(node.cloneNode(true)))
      frame.appendChild(body)
      return contentExtent(frame)
    },
    destroy() {
      probe.remove()
    },
  }
}

function pageLimitPx(): number {
  const ruler = document.createElement('div')
  ruler.style.position = 'absolute'
  ruler.style.visibility = 'hidden'
  ruler.style.width = '0'
  document.body.appendChild(ruler)
  ruler.style.height = 'calc(var(--page-height) - var(--margin-top) - var(--margin-bottom))'
  const height = ruler.offsetHeight
  ruler.remove()
  return height
}

function contentExtent(container: HTMLElement): number {
  let extent = container.scrollHeight
  const base = container.getBoundingClientRect().top
  for (const child of elementChildren(container)) {
    const marginBottom = parseFloat(getComputedStyle(child).marginBottom) || 0
    extent = Math.max(extent, child.getBoundingClientRect().bottom - base + marginBottom)
  }
  return extent
}

function elementChildren(parent: Element): HTMLElement[] {
  return [...parent.children].filter((node): node is HTMLElement => node instanceof HTMLElement)
}

function isHeading(node: HTMLElement): boolean {
  return node.matches('h1, h2, h3, h4, .kicker')
}

function isSkippable(node: HTMLElement): boolean {
  if (node.matches('img, svg')) return false
  if (node.querySelector('img, svg')) return false
  return !node.textContent?.trim()
}
