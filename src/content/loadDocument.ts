import type { ComponentType } from 'react'
import rawWorkbookDocument from '../../content/document.json'
import rawRoteirosDocument from '../../content/document-experiencias.json'
import rawCasosDocument from '../../content/document-casos.json'
import rawCronogramaDocument from '../../content/document-cronograma.json'
import {
  ContentError,
  parseCasoPage,
  parseCronogramaPage,
  parseDocument,
  parseRoteiroPage,
  parseVersoPage,
  parseWorkbookPage,
} from './schema'
import type {
  CasoPageContent,
  CronogramaPageContent,
  EditorialDocument,
  RoteiroPageContent,
  VersoPageContent,
  WorkbookPageContent,
} from './types'

type MdxModule = {
  default: ComponentType
  frontmatter?: unknown
}

export type DocumentKey = 'oficinas' | 'experiencias' | 'casos' | 'cronograma'

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
  {
    key: 'casos',
    label: 'Estudos de caso',
    href: './?doc=casos',
    manifestId: 'estudos-de-caso-governanca-e-infraestrutura',
  },
  {
    key: 'cronograma',
    label: 'Tempos e movimentos',
    href: './?doc=cronograma',
    manifestId: 'tempos-e-movimentos',
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
  | {
      id: string
      strategy: 'caso'
      layout: 'caso'
      source: string
      page: CasoPageContent
    }
  | {
      id: string
      strategy: 'cronograma'
      layout: 'cronograma'
      source: string
      page: CronogramaPageContent
    }
  | {
      id: string
      strategy: 'verso'
      layout: 'verso'
      source: string
      page: VersoPageContent
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
const casoModules = import.meta.glob('../../content/casos/*.json', {
  eager: true,
  import: 'default',
})
const cronogramaModules = import.meta.glob('../../content/cronograma/*.json', {
  eager: true,
  import: 'default',
})
const versoModules = import.meta.glob('../../content/verso/*.json', {
  eager: true,
  import: 'default',
})

export function documentKeyFromLocation(): DocumentKey {
  if (typeof window === 'undefined') return 'oficinas'
  const requested = new URLSearchParams(window.location.search).get('doc')
  if (requested === 'experiencias') return 'experiencias'
  if (requested === 'casos') return 'casos'
  if (requested === 'cronograma') return 'cronograma'
  return 'oficinas'
}

function findModule(modules: Record<string, unknown>, source: string): unknown {
  const match = Object.entries(modules).find(([key]) =>
    key.replaceAll('\\', '/').endsWith(`/${source}`),
  )
  if (!match) {
    throw new ContentError(
      `No loaded module matches content/${source}. The file must sit in content/chapters/, content/workbook/, content/roteiros/, content/casos/, content/cronograma/, or content/verso/.`,
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
  const manifest =
    key === 'experiencias'
      ? rawRoteirosDocument
      : key === 'casos'
        ? rawCasosDocument
        : key === 'cronograma'
          ? rawCronogramaDocument
          : rawWorkbookDocument
  const document = parseDocument(manifest)
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

    if (section.strategy === 'caso') {
      return {
        id: section.id,
        strategy: 'caso',
        layout: 'caso',
        source: section.source,
        page: parseCasoPage(findModule(casoModules, section.source), section.source),
      }
    }

    if (section.strategy === 'verso') {
      return {
        id: section.id,
        strategy: 'verso',
        layout: 'verso',
        source: section.source,
        page: parseVersoPage(findModule(versoModules, section.source), section.source),
      }
    }

    if (section.strategy === 'cronograma') {
      return {
        id: section.id,
        strategy: 'cronograma',
        layout: 'cronograma',
        source: section.source,
        page: parseCronogramaPage(
          findModule(cronogramaModules, section.source),
          section.source,
        ),
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
