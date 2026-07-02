'use client'

import { useId } from 'react'
import { useFormContext, FieldPath } from 'react-hook-form'
import { FormResume } from '@/lib/types'
import { inputCls, labelCls } from './fieldStyles'

export function Field({
  label,
  name,
  placeholder,
  textarea,
  dataField,
}: {
  label: string
  name: FieldPath<FormResume>
  placeholder?: string
  textarea?: boolean
  dataField?: string
}) {
  const { register } = useFormContext<FormResume>()
  const id = useId()
  return (
    <div className="flex flex-col gap-1" data-field={dataField}>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {textarea ? (
        <textarea
          id={id}
          {...register(name)}
          placeholder={placeholder}
          rows={4}
          className={`${inputCls} resize-y`}
        />
      ) : (
        <input id={id} {...register(name)} placeholder={placeholder} className={inputCls} />
      )}
    </div>
  )
}
