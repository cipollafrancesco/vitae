import { CustomSection } from '@/lib/types'
import { SectionHeader } from './primitives/SectionHeader'
import { EntryTitle, EntryMeta } from './primitives/EntryHeading'
import { BulletList } from './primitives/BulletList'

export function CustomSectionView({
  section,
  dateInline,
}: {
  section: CustomSection
  dateInline?: boolean
}) {
  if (!section.entries.length) return null
  return (
    <div className="rp-section" data-rp-section={section.id}>
      <SectionHeader>{section.title || 'Section'}</SectionHeader>
      {section.entries.map((e, i) => (
        <div key={i} className="rp-exp-entry" data-rp-entry={i}>
          {e.title && (
            <EntryTitle
              className="rp-exp-title"
              title={e.title}
              dateRange={e.dateRange}
              dateInline={dateInline}
            />
          )}
          {e.subtitle && <p className="rp-exp-company">{e.subtitle}</p>}
          <EntryMeta dateRange={e.dateRange} dateInline={dateInline} />
          <BulletList bullets={e.bullets} />
        </div>
      ))}
    </div>
  )
}
