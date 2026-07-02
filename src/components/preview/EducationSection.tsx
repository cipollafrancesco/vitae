import { Education } from '@/lib/types'
import { SectionHeader } from './primitives/SectionHeader'
import { EntryTitle, EntryMeta } from './primitives/EntryHeading'

function EducationEntry({
  entry,
  dateInline,
  index,
}: {
  entry: Education
  dateInline?: boolean
  index: number
}) {
  return (
    <div className="rp-edu-entry" data-rp-entry={index}>
      <EntryTitle
        className="rp-edu-degree"
        title={entry.degree}
        dateRange={entry.dateRange}
        dateInline={dateInline}
      />
      <p className="rp-edu-institution">{entry.institution}</p>
      <EntryMeta dateRange={entry.dateRange} location={entry.location} dateInline={dateInline} />
    </div>
  )
}

export function EducationSection({
  education,
  dateInline,
  sectionId,
}: {
  education: Education[]
  dateInline?: boolean
  sectionId: string
}) {
  if (!education.length) return null
  return (
    <div className="rp-section" data-rp-section={sectionId}>
      <SectionHeader>Education</SectionHeader>
      {education.map((e, i) => (
        <EducationEntry key={i} entry={e} dateInline={dateInline} index={i} />
      ))}
    </div>
  )
}
