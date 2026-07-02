import { Resume } from './types'

export function resumeToText(r: Resume): string {
  const lines: string[] = []
  const sep = () => lines.push('')
  const rule = (heading: string) => {
    lines.push(heading.toUpperCase())
    lines.push('─'.repeat(50))
  }

  lines.push(r.profile.name.toUpperCase())
  if (r.profile.role) lines.push(r.profile.role)
  sep()

  const contactParts = [
    r.profile.email,
    r.profile.phone,
    r.profile.location,
    r.profile.website,
    r.profile.linkedin,
    r.profile.github,
  ].filter(Boolean)
  if (contactParts.length) {
    lines.push(contactParts.join(' | '))
    sep()
  }

  if (r.profile.summary) {
    rule('Summary')
    sep()
    lines.push(r.profile.summary)
    sep()
  }

  if (r.experience.length) {
    rule('Work Experience')
    sep()
    for (const e of r.experience) {
      lines.push(`${e.title} — ${e.company}`)
      const meta = [e.dateRange, e.location].filter(Boolean).join(' | ')
      if (meta) lines.push(meta)
      if (e.note) lines.push(e.note)
      for (const b of e.bullets) lines.push(`- ${b}`)
      sep()
    }
  }

  if (r.education.length) {
    rule('Education')
    sep()
    for (const ed of r.education) {
      lines.push(ed.degree)
      lines.push(ed.institution)
      const meta = [ed.dateRange, ed.location].filter(Boolean).join(' | ')
      if (meta) lines.push(meta)
      sep()
    }
  }

  if (r.skills.length) {
    rule('Skills')
    sep()
    lines.push(r.skills.join(', '))
    sep()
  }

  if (r.projects.length) {
    rule('Other Projects')
    sep()
    for (const p of r.projects) {
      lines.push(p.dateRange ? `${p.title} (${p.dateRange})` : p.title)
      for (const b of p.bullets) lines.push(`- ${b}`)
      sep()
    }
  }

  if (r.languages.length) {
    rule('Languages')
    sep()
    for (const l of r.languages) lines.push(`${l.name}: ${l.level}`)
    sep()
  }

  if (r.interests.length) {
    rule('Interests')
    sep()
    lines.push(r.interests.join(', '))
  }

  return lines.join('\n').trim()
}
