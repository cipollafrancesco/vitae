import { ReactNode } from 'react'

interface ContactItemProps {
  icon: ReactNode
  text: string
  field: string
}

export function ContactItem({ icon, text, field }: ContactItemProps) {
  if (!text) return null
  return (
    <div className="rp-contact-item" data-rp-field={field}>
      <span className="rp-contact-icon">{icon}</span>
      <span>{text}</span>
    </div>
  )
}
