import type { LoadedPublication, LoadedSection } from '../content/loadDocument'
import { CasoPage } from './CasoPage'
import { CronogramaPage } from './CronogramaPage'
import { StandardPage } from './StandardPage'
import { VersoPage } from './VersoPage'
import { WorkbookPage } from './WorkbookPage'
import { RoteiroPage } from './RoteiroPage'

type SectionViewProps = {
  section: LoadedSection
  publication: LoadedPublication
  showMasthead: boolean
}

export function SectionView({ section, publication, showMasthead }: SectionViewProps) {
  if (section.layout === 'workbook') {
    return (
      <WorkbookPage id={section.id} page={section.page} />
    )
  }

  if (section.layout === 'roteiro') {
    return (
      <RoteiroPage id={section.id} page={section.page} />
    )
  }

  if (section.layout === 'caso') {
    const pageNumber = publication.sections.findIndex((item) => item.id === section.id) + 1
    return (
      <CasoPage
        id={section.id}
        page={section.page}
        publication={publication}
        pageNumber={pageNumber}
        pageCount={publication.sections.length}
      />
    )
  }

  if (section.layout === 'verso') {
    return <VersoPage id={section.id} />
  }

  if (section.layout === 'cronograma') {
    return (
      <CronogramaPage id={section.id} page={section.page} />
    )
  }

  const Content = section.Content
  return (
    <StandardPage
      id={section.id}
      kicker={section.kicker}
      sheetVariant={section.sheetVariant}
      folio={section.folio}
      showMasthead={showMasthead}
      publication={publication}
    >
      <Content />
    </StandardPage>
  )
}
