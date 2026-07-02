'use client'

import { ProfileField } from './ProfileField'

export function ContactsForm() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <ProfileField label="Email" name="email" placeholder="you@example.com" />
      <ProfileField label="Phone" name="phone" placeholder="+1 234 567 890" />
      <ProfileField label="Location" name="location" placeholder="City, Country" />
      <ProfileField label="Website" name="website" placeholder="yoursite.com" />
      <ProfileField label="LinkedIn" name="linkedin" placeholder="linkedin.com/in/you" />
      <ProfileField label="GitHub" name="github" placeholder="github.com/you" />
    </div>
  )
}
