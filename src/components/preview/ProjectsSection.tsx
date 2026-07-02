import { Project } from '@/lib/types'
import { SectionHeader } from './primitives/SectionHeader'
import { EntryTitle, EntryMeta } from './primitives/EntryHeading'
import { BulletList } from './primitives/BulletList'

function ProjectEntry({
  entry,
  dateInline,
  index,
}: {
  entry: Project
  dateInline?: boolean
  index: number
}) {
  return (
    <div className="rp-project-entry" data-rp-entry={index}>
      <EntryTitle
        className="rp-project-title"
        title={entry.title}
        dateRange={entry.dateRange}
        dateInline={dateInline}
      />
      <EntryMeta dateRange={entry.dateRange} location={entry.location} dateInline={dateInline} />
      {entry.note && <p className="rp-note">{entry.note}</p>}
      <BulletList bullets={entry.bullets} />
    </div>
  )
}

export function ProjectsSection({
  projects,
  dateInline,
  sectionId,
}: {
  projects: Project[]
  dateInline?: boolean
  sectionId: string
}) {
  if (!projects.length) return null
  return (
    <div className="rp-section" data-rp-section={sectionId}>
      <SectionHeader>Other Projects</SectionHeader>
      {projects.map((p, i) => (
        <ProjectEntry key={i} entry={p} dateInline={dateInline} index={i} />
      ))}
    </div>
  )
}
