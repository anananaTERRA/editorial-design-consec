import { MDXProvider } from '@mdx-js/react'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { documentChoices, type LoadedPublication } from '../content/loadDocument'
import { resolveProfile } from '../engine/profile'
import { paginationEngine } from '../engine/pagination'
import { paginateInto } from '../lib/paginateDesk'
import { mdxComponents } from '../mdx-components'
import { SectionView } from './SectionView'

const profileCopy = {
  landscape: {
    screen: 'Prévia em folhas A4 paisagem. O que não cabe continua na folha seguinte.',
    digital: 'Perfil digital · A4 paisagem · sem sangria',
    print: 'Perfil de impressão · A4 paisagem com sangria · a cor não é convertida',
  },
  portrait: {
    screen: 'Prévia em folhas A4 retrato, uma por estudo de caso.',
    digital: 'Perfil digital · A4 retrato · sem sangria',
    print: 'Perfil de impressão · A4 retrato com sangria · a cor não é convertida',
  },
} as const

export function DocumentShell({ publication }: { publication: LoadedPublication }) {
  const profile = resolveProfile(import.meta.env.MODE)
  const deskRef = useRef<HTMLDivElement>(null)
  const sourceRef = useRef<HTMLDivElement>(null)

  const portrait = publication.sections.every((section) => section.layout === 'caso')
  const copy = portrait ? profileCopy.portrait : profileCopy.landscape
  const scriptDocument =
    publication.sections.some((section) => section.layout === 'roteiro') &&
    publication.sections.every(
      (section) => section.layout === 'roteiro' || section.layout === 'verso',
    )
  const scheduleDocument =
    publication.sections.length > 0 &&
    publication.sections.every((section) => section.layout === 'cronograma')
  const screenCopy = scheduleDocument
    ? 'Prévia em folhas A4 paisagem, uma ficha A5 por parte do dia. A imposição corta cada folha em duas fichas.'
    : scriptDocument
      ? 'Prévia em folhas A4 paisagem, uma por convidado. Impressão em A5 paisagem.'
      : copy.screen

  useEffect(() => {
    document.title = `${publication.title} — ${publication.subtitle}`
  }, [publication.title, publication.subtitle])

  const mastheadSectionId = publication.sections.find(
    (section) => section.layout === 'standard' && section.sheetVariant !== 'cover',
  )?.id

  /* A orientação troca as medidas da folha antes de o paginador medir o conteúdo. */
  useLayoutEffect(() => {
    document.documentElement.dataset.orientation = portrait ? 'portrait' : 'landscape'
  }, [portrait])

  useLayoutEffect(() => {
    const desk = deskRef.current
    const source = sourceRef.current
    if (!desk || !source) return
    return paginateInto(source, desk)
  }, [publication])

  return (
    <MDXProvider components={mdxComponents}>
      <div className="preview-banner">
        <span>{profile === 'screen' ? screenCopy : copy[profile]}</span>
        <nav className="preview-docs" aria-label="Documentos">
          {documentChoices.map((choice) => (
            <a
              key={choice.key}
              href={choice.href}
              aria-current={publication.id === choice.manifestId ? 'page' : undefined}
            >
              {choice.label}
            </a>
          ))}
        </nav>
      </div>
      <div
        ref={deskRef}
        className="desk"
        data-profile={profile}
        data-pagination-engine={paginationEngine.id}
      />
      <div ref={sourceRef} className="paginate-source" aria-hidden="true">
        {publication.sections.map((section) => (
          <SectionView
            key={section.id}
            section={section}
            publication={publication}
            showMasthead={section.id === mastheadSectionId}
          />
        ))}
      </div>
    </MDXProvider>
  )
}
