'use client'

import { useFormContext } from 'react-hook-form'
import { FormResume } from '@/lib/types'
import { PhotoUpload } from './PhotoUpload'
import { ProfileField } from './ProfileField'

export function ProfileForm() {
  const { register } = useFormContext<FormResume>()
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <PhotoUpload />
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register('profile.showPhoto')}
            className="w-4 h-4 accent-brand cursor-pointer"
          />
          <span className="text-xs text-gray-600">Show photo</span>
        </label>
      </div>
      <ProfileField label="Full Name" name="name" placeholder="Your Name" />
      <ProfileField label="Role / Title" name="role" placeholder="e.g. Senior Frontend Engineer" />
      <ProfileField
        label="Summary"
        name="summary"
        placeholder="A short professional summary…"
        textarea
      />
    </div>
  )
}
