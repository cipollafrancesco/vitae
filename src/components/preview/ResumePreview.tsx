import { Resume } from '@/lib/types'
import { PrintSheet } from './PrintSheet'
import { Header } from './Header'
import { ContactBar } from './ContactBar'
import { ExperienceSection } from './ExperienceSection'
import { EducationSection } from './EducationSection'
import { SkillsSection } from './SkillsSection'
import { ProjectsSection } from './ProjectsSection'
import { LanguagesSection } from './LanguagesSection'
import { InterestsSection } from './InterestsSection'
import { CustomSectionView } from './CustomSectionView'

export function ResumePreview({ resume }: { resume: Resume }) {
  const renderSection = (id: string) => {
    switch (id) {
      case 'experience':
        return (
          <ExperienceSection
            key={id}
            sectionId={id}
            experience={resume.experience}
            dateInline={resume.dateInline}
          />
        )
      case 'education':
        return (
          <EducationSection
            key={id}
            sectionId={id}
            education={resume.education}
            dateInline={resume.dateInline}
          />
        )
      case 'skills':
        return <SkillsSection key={id} sectionId={id} skills={resume.skills} />
      case 'projects':
        return (
          <ProjectsSection
            key={id}
            sectionId={id}
            projects={resume.projects}
            dateInline={resume.dateInline}
          />
        )
      case 'languages':
        return <LanguagesSection key={id} sectionId={id} languages={resume.languages} />
      case 'interests':
        return <InterestsSection key={id} sectionId={id} interests={resume.interests} />
      default: {
        const cs = resume.customSections.find((c) => c.id === id)
        return cs ? (
          <CustomSectionView key={id} section={cs} dateInline={resume.dateInline} />
        ) : null
      }
    }
  }

  return (
    <PrintSheet
      className="resume-page"
      style={{ '--accent': resume.accentColor } as React.CSSProperties}
      marginClass="rp-vmargin"
    >
      <Header profile={resume.profile} />
      <ContactBar profile={resume.profile} />
      <div className="rp-body">
        <div>{resume.layout.left.map(renderSection)}</div>
        <div>{resume.layout.right.map(renderSection)}</div>
      </div>
    </PrintSheet>
  )
}
