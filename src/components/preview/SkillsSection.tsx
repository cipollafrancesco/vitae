import { SectionHeader } from './primitives/SectionHeader'
import { Pill } from './primitives/Pill'

export function SkillsSection({ skills, sectionId }: { skills: string[]; sectionId: string }) {
  if (!skills.length) return null
  return (
    <div className="rp-section" data-rp-section={sectionId}>
      <SectionHeader>Skills</SectionHeader>
      <div className="rp-pills-wrap">
        {skills.map((s, i) => (
          <Pill key={i} label={s} variant="solid" index={i} />
        ))}
      </div>
    </div>
  )
}
