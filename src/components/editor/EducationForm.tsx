'use client'

import { useFormContext, useFieldArray } from 'react-hook-form'
import { FormResume } from '@/lib/types'
import { ListControls } from './ListControls'
import { Field } from './Field'
import { AddButton } from './AddButton'

function EducationEntry({ index, total }: { index: number; total: number }) {
  const { control } = useFormContext<FormResume>()
  const { remove, move } = useFieldArray({ control, name: 'education' })
  const itemLabel = `education entry ${index + 1}`

  return (
    <div className="card-surface rounded-lg p-3 flex flex-col gap-2.5 bg-white" data-entry={index}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-500">Entry {index + 1}</span>
        <ListControls
          canMoveUp={index > 0}
          canMoveDown={index < total - 1}
          onMoveUp={() => move(index, index - 1)}
          onMoveDown={() => move(index, index + 1)}
          onRemove={() => remove(index)}
          itemLabel={itemLabel}
        />
      </div>
      <Field label="Degree" name={`education.${index}.degree`} />
      <Field label="Institution" name={`education.${index}.institution`} />
      <div className="grid grid-cols-2 gap-2">
        <Field
          label="Date Range"
          name={`education.${index}.dateRange`}
          placeholder="MM/YYYY - MM/YYYY"
        />
        <Field label="Location" name={`education.${index}.location`} />
      </div>
    </div>
  )
}

export function EducationForm() {
  const { control } = useFormContext<FormResume>()
  const { fields, append } = useFieldArray({ control, name: 'education' })

  return (
    <div className="flex flex-col gap-3">
      {fields.map((f, i) => (
        <EducationEntry key={f.id} index={i} total={fields.length} />
      ))}
      <AddButton
        onClick={() => append({ degree: '', institution: '', location: '', dateRange: '' })}
      >
        + Add education
      </AddButton>
    </div>
  )
}
