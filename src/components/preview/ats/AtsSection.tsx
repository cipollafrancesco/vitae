import { ReactNode } from 'react'

interface Props {
  heading: string
  children: ReactNode
  sectionId?: string
}

export function AtsSection({ heading, children, sectionId }: Props) {
  return (
    <section className="ats-section" data-rp-section={sectionId}>
      <h2 className="ats-h">{heading}</h2>
      {children}
    </section>
  )
}
