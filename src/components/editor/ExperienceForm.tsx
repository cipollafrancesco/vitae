'use client'

import { useFormContext, useFieldArray } from 'react-hook-form'
import { FormResume } from '@/lib/types'
import { ListControls } from './ListControls'
import { Field } from './Field'
import { BulletsEditor } from './BulletsEditor'
import { AddButton } from './AddButton'

function ExperienceEntry({ index, total }: { index: number; total: number }) {
  const { control } = useFormContext<FormResume>()
  const { remove, move } = useFieldArray({ control, name: 'experience' })
  const itemLabel = `experience entry ${index + 1}`

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
      <Field label="Job Title" name={`experience.${index}.title`} />
      <Field label="Company" name={`experience.${index}.company`} />
      <div className="grid grid-cols-2 gap-2">
        <Field
          label="Date Range"
          name={`experience.${index}.dateRange`}
          placeholder="MM/YYYY - Present"
        />
        <Field label="Location" name={`experience.${index}.location`} placeholder="City / Remote" />
      </div>
      <Field label="Note (italic, optional)" name={`experience.${index}.note`} />
      <BulletsEditor name={`experience.${index}.bullets`} />
    </div>
  )
}

export function ExperienceForm() {
  const { control } = useFormContext<FormResume>()
  const { fields, append } = useFieldArray({ control, name: 'experience' })

  return (
    <div className="flex flex-col gap-3">
      {fields.map((f, i) => (
        <ExperienceEntry key={f.id} index={i} total={fields.length} />
      ))}
      <AddButton
        onClick={() =>
          append({
            title: '',
            company: '',
            dateRange: '',
            location: '',
            note: '',
            bullets: [{ value: '' }],
          })
        }
      >
        + Add experience
      </AddButton>
    </div>
  )
}
