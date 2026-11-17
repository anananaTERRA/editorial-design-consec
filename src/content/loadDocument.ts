import type { ComponentType } from 'react'
import rawWorkbookDocument from '../../content/document.json'
import rawRoteirosDocument from '../../content/document-experiencias.json'
import { ContentError, parseDocument, parseRoteiroPage, parseWorkbookPage } from './schema'
import type {
  EditorialDocument,
  RoteiroPageContent,
  WorkbookPageContent,
} from './types'

type MdxModule = {
  default: ComponentType
  frontmatter?: unknown
}

export type DocumentKey = 'oficinas' | 'experiencias'

export const documentChoices: {
  key: DocumentKey
  label: string
  href: string
  manifestId: string
}[] = [
  {
    key: 'oficinas',
    label: 'Caderno de oficinas',
    href: './',
    manifestId: 'ia-na-educacao-oficinas',
  },
  {
    key: 'experiencias',
    label: 'Experiências das Redes de Ensino',
    href: './?doc=experiencias',
    manifestId: 'experiencias-redes-ensino',
  },
]

export type LoadedSection =
  | {
      id: string
      strategy: 'flow'
      layout: 'standard'
      source: string
      kicker?: string
      sheetVariant?: string
      folio?: 'on' | 'off'
      Content: ComponentType
    }
  | {
      id: string
      strategy: 'workbook'
      layout: 'workbook'
      source: string
      folio?: 'on' | 'off'
      page: WorkbookPageContent
    }
  | {
      id: string
      strategy: 'roteiro'
      layout: 'roteiro'
      source: string
      page: RoteiroPageContent
    }

export type LoadedPublication = Omit<EditorialDocument, 'sections'> & {
  sections: LoadedSection[]
}

const mdxModules = import.meta.glob('../../content/chapters/*.mdx', { eager: true })
const workbookModules = import.meta.glob('../../content/workbook/*.json', {
  eager: true,
  import: 'default',
})
const roteiroModules = import.meta.glob('../../content/roteiros/*.json', {
  eager: true,
  import: 'default',
})

export function documentKeyFromLocation(): DocumentKey {
  if (typeof window === 'undefined') return 'oficinas'
  const requested = new URLSearchParams(window.location.search).get('doc')
  return requested === 'experiencias' ? 'experiencias' : 'oficinas'
}

function findModule(modules: Record<string, unknown>, source: string): unknown {
  const match = Object.entries(modules).find(([key]) =>
    key.replaceAll('\\', '/').endsWith(`/${source}`),
  )
  if (!match) {
    throw new ContentError(
      `No loaded module matches content/${source}. The file must sit in content/chapters/, content/workbook/, or content/roteiros/.`,
    )
  }
  return match[1]
}

function readFrontmatter(frontmatter: unknown, source: string) {
  if (frontmatter === undefined) return {}
  if (typeof frontmatter !== 'object' || frontmatter === null || Array.isArray(frontmatter)) {
    throw new ContentError(`${source} frontmatter must be an object`)
  }
  const record = frontmatter as Record<string, unknown>

  const readOptionalString = (key: string): string | undefined => {
    const value = record[key]
    if (value === undefined) return undefined
    if (typeof value !== 'string' || value.trim() === '') {
      throw new ContentError(`${source} frontmatter.${key} must be a non-empty string`)
    }
    return value.trim()
  }

  const folio = record.folio
  if (folio !== undefined && folio !== 'on' && folio !== 'off') {
    throw new ContentError(`${source} frontmatter.folio must be "on" or "off"`)
  }

  return {
    kicker: readOptionalString('kicker'),
    sheetVariant: readOptionalString('sheetVariant'),
    ...(folio === 'on' || folio === 'off' ? { folio } : {}),
  }
}

export function loadPublication(key: DocumentKey = documentKeyFromLocation()): LoadedPublication {
  const document = parseDocument(key === 'experiencias' ? rawRoteirosDocument : rawWorkbookDocument)
  const sections = document.sections.map((section): LoadedSection => {
    if (section.strategy === 'flow') {
      const loaded = findModule(mdxModules, section.source)
      if (
        typeof loaded !== 'object' ||
        loaded === null ||
        !('default' in loaded) ||
        typeof loaded.default !== 'function'
      ) {
        throw new ContentError(`${section.source} did not export an MDX component`)
      }
      const mdx = loaded as MdxModule
      return {
        id: section.id,
        strategy: 'flow',
        layout: 'standard',
        source: section.source,
        ...readFrontmatter(mdx.frontmatter, section.source),
        Content: mdx.default,
      }
    }

    if (section.strategy === 'roteiro') {
      return {
        id: section.id,
        strategy: 'roteiro',
        layout: 'roteiro',
        source: section.source,
        page: parseRoteiroPage(findModule(roteiroModules, section.source), section.source),
      }
    }

    return {
      id: section.id,
      strategy: 'workbook',
      layout: 'workbook',
      source: section.source,
      page: parseWorkbookPage(findModule(workbookModules, section.source), section.source),
    }
  })

  return { ...document, sections }
}
