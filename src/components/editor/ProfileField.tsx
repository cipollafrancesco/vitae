'use client'

import { FormResume } from '@/lib/types'
import { Field } from './Field'

export function ProfileField({
  label,
  name,
  placeholder,
  textarea,
}: {
  label: string
  name: keyof FormResume['profile']
  placeholder?: string
  textarea?: boolean
}) {
  return (
    <Field
      label={label}
      name={`profile.${name}`}
      placeholder={placeholder}
      textarea={textarea}
      dataField={name}
    />
  )
}
