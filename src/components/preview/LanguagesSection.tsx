import { Language } from '@/lib/types'
import { SectionHeader } from './primitives/SectionHeader'

export function LanguagesSection({
  languages,
  sectionId,
}: {
  languages: Language[]
  sectionId: string
}) {
  if (!languages.length) return null
  return (
    <div className="rp-section" data-rp-section={sectionId}>
      <SectionHeader>Languages</SectionHeader>
      <div className="rp-languages-grid">
        {languages.map((l, i) => (
          <div key={i} className="rp-language-entry" data-rp-entry={i}>
            <p className="rp-language-name">{l.name}</p>
            <p className="rp-language-level">{l.level}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
