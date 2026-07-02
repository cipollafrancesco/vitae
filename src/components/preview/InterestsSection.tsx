import { SectionHeader } from './primitives/SectionHeader'
import { Pill } from './primitives/Pill'

export function InterestsSection({
  interests,
  sectionId,
}: {
  interests: string[]
  sectionId: string
}) {
  if (!interests.length) return null
  return (
    <div className="rp-section" data-rp-section={sectionId}>
      <SectionHeader>Interests</SectionHeader>
      <div className="rp-pills-wrap">
        {interests.map((item, i) => (
          <Pill key={i} label={item} variant="outline" index={i} />
        ))}
      </div>
    </div>
  )
}
