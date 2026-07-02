import { Experience } from '@/lib/types'
import { SectionHeader } from './primitives/SectionHeader'
import { EntryTitle, EntryMeta } from './primitives/EntryHeading'
import { BulletList } from './primitives/BulletList'

function ExperienceEntry({
  entry,
  dateInline,
  index,
}: {
  entry: Experience
  dateInline?: boolean
  index: number
}) {
  return (
    <div className="rp-exp-entry" data-rp-entry={index}>
      <EntryTitle
        className="rp-exp-title"
        title={entry.title}
        dateRange={entry.dateRange}
        dateInline={dateInline}
      />
      <p className="rp-exp-company">{entry.company}</p>
      <EntryMeta dateRange={entry.dateRange} location={entry.location} dateInline={dateInline} />
      {entry.note && <p className="rp-note">{entry.note}</p>}
      <BulletList bullets={entry.bullets} />
    </div>
  )
}

export function ExperienceSection({
  experience,
  dateInline,
  sectionId,
}: {
  experience: Experience[]
  dateInline?: boolean
  sectionId: string
}) {
  if (!experience.length) return null
  return (
    <div className="rp-section" data-rp-section={sectionId}>
      <SectionHeader>Work Experience</SectionHeader>
      {experience.map((e, i) => (
        <ExperienceEntry key={i} entry={e} dateInline={dateInline} index={i} />
      ))}
    </div>
  )
}
