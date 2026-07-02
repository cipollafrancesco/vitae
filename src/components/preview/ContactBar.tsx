import { Profile } from '@/lib/types'
import { ContactItem } from './primitives/ContactItem'
import {
  IconEmail,
  IconPhone,
  IconLocation,
  IconGlobe,
  IconLinkedIn,
  IconGitHub,
} from './primitives/Icons'

export function ContactBar({ profile }: { profile: Profile }) {
  return (
    <div className="rp-contact-bar" data-rp-section="contacts">
      <ContactItem icon={<IconEmail />} text={profile.email} field="email" />
      <ContactItem icon={<IconPhone />} text={profile.phone} field="phone" />
      <ContactItem icon={<IconLocation />} text={profile.location} field="location" />
      <ContactItem icon={<IconGlobe />} text={profile.website} field="website" />
      <ContactItem icon={<IconLinkedIn />} text={profile.linkedin} field="linkedin" />
      <ContactItem icon={<IconGitHub />} text={profile.github} field="github" />
    </div>
  )
}
