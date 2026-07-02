import { Resume } from '@/lib/types'
import { PrintSheet } from '../PrintSheet'
import { AtsSection } from './AtsSection'
import { AtsEntry } from './AtsEntry'

interface Props {
  resume: Resume
}

export function AtsResumePreview({ resume: r }: Props) {
  const p = r.profile
  const contactParts = [p.email, p.phone, p.location, p.website, p.linkedin, p.github].filter(
    Boolean,
  )
  const order = [...r.layout.left, ...r.layout.right]

  const renderSection = (id: string) => {
    switch (id) {
      case 'experience':
        if (!r.experience.length) return null
        return (
          <AtsSection key={id} heading="Work Experience" sectionId={id}>
            {r.experience.map((e, i) => (
              <AtsEntry
                key={i}
                index={i}
                title={`${e.title} — ${e.company}`}
                metaLines={[[e.dateRange, e.location].filter(Boolean).join(' | '), e.note]}
                bullets={e.bullets}
              />
            ))}
          </AtsSection>
        )
      case 'education':
        if (!r.education.length) return null
        return (
          <AtsSection key={id} heading="Education" sectionId={id}>
            {r.education.map((ed, i) => (
              <AtsEntry
                key={i}
                index={i}
                title={ed.degree}
                metaLines={[
                  ed.institution,
                  [ed.dateRange, ed.location].filter(Boolean).join(' | '),
                ]}
              />
            ))}
          </AtsSection>
        )
      case 'skills':
        if (!r.skills.length) return null
        return (
          <AtsSection key={id} heading="Skills" sectionId={id}>
            <p className="ats-body-text">{r.skills.join(', ')}</p>
          </AtsSection>
        )
      case 'projects':
        if (!r.projects.length) return null
        return (
          <AtsSection key={id} heading="Other Projects" sectionId={id}>
            {r.projects.map((proj, i) => (
              <AtsEntry
                key={i}
                index={i}
                title={proj.title}
                metaLines={[[proj.dateRange, proj.location].filter(Boolean).join(' | '), proj.note]}
                bullets={proj.bullets}
              />
            ))}
          </AtsSection>
        )
      case 'languages':
        if (!r.languages.length) return null
        return (
          <AtsSection key={id} heading="Languages" sectionId={id}>
            {r.languages.map((l, i) => (
              <p key={i} className="ats-entry-meta" data-rp-entry={i}>
                <strong>{l.name}</strong>: {l.level}
              </p>
            ))}
          </AtsSection>
        )
      case 'interests':
        if (!r.interests.length) return null
        return (
          <AtsSection key={id} heading="Interests" sectionId={id}>
            <p className="ats-body-text">{r.interests.join(', ')}</p>
          </AtsSection>
        )
      default: {
        const cs = r.customSections.find((c) => c.id === id)
        if (!cs || !cs.entries.length) return null
        return (
          <AtsSection key={id} heading={cs.title || 'Section'} sectionId={id}>
            {cs.entries.map((e, i) => (
              <AtsEntry
                key={i}
                index={i}
                title={e.title && (e.subtitle ? `${e.title} — ${e.subtitle}` : e.title)}
                metaLines={[e.dateRange]}
                bullets={e.bullets}
              />
            ))}
          </AtsSection>
        )
      }
    }
  }

  return (
    <PrintSheet className="ats-page" marginClass="ats-vmargin">
      <h1 className="ats-name" data-rp-section="profile" data-rp-field="name">
        {p.name}
      </h1>
      {p.role && (
        <p className="ats-role" data-rp-section="profile" data-rp-field="role">
          {p.role}
        </p>
      )}
      {contactParts.length > 0 && (
        <p className="ats-contact" data-rp-section="contacts">
          {contactParts.join(' | ')}
        </p>
      )}

      {p.summary && (
        <AtsSection heading="Summary" sectionId="profile">
          <p className="ats-body-text" data-rp-field="summary">
            {p.summary}
          </p>
        </AtsSection>
      )}

      {order.map(renderSection)}
    </PrintSheet>
  )
}
