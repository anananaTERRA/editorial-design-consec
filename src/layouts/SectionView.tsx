import type { LoadedPublication, LoadedSection } from '../content/loadDocument'
import { StandardPage } from './StandardPage'
import { WorkbookPage } from './WorkbookPage'

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
