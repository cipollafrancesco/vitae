'use client'

import { useFormContext, useFieldArray } from 'react-hook-form'
import { FormResume } from '@/lib/types'
import { ListControls } from './ListControls'
import { Field } from './Field'
import { BulletsEditor } from './BulletsEditor'
import { AddButton } from './AddButton'

function ProjectEntry({ index, total }: { index: number; total: number }) {
  const { control } = useFormContext<FormResume>()
  const { remove, move } = useFieldArray({ control, name: 'projects' })
  const itemLabel = `project ${index + 1}`

  return (
    <div className="card-surface rounded-lg p-3 flex flex-col gap-2.5 bg-white" data-entry={index}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-500">Project {index + 1}</span>
        <ListControls
          canMoveUp={index > 0}
          canMoveDown={index < total - 1}
          onMoveUp={() => move(index, index - 1)}
          onMoveDown={() => move(index, index + 1)}
          onRemove={() => remove(index)}
          itemLabel={itemLabel}
        />
      </div>
      <Field label="Project Title" name={`projects.${index}.title`} />
      <div className="grid grid-cols-2 gap-2">
        <Field
          label="Date Range"
          name={`projects.${index}.dateRange`}
          placeholder="2024 - Present"
        />
        <Field label="Location" name={`projects.${index}.location`} placeholder="City / Remote" />
      </div>
      <Field label="Note (italic, optional)" name={`projects.${index}.note`} />
      <BulletsEditor name={`projects.${index}.bullets`} />
    </div>
  )
}

export function ProjectsForm() {
  const { control } = useFormContext<FormResume>()
  const { fields, append } = useFieldArray({ control, name: 'projects' })

  return (
    <div className="flex flex-col gap-3">
      {fields.map((f, i) => (
        <ProjectEntry key={f.id} index={i} total={fields.length} />
      ))}
      <AddButton
        onClick={() =>
          append({
            title: '',
            dateRange: '',
            location: '',
            note: '',
            bullets: [{ value: '' }],
          })
        }
      >
        + Add project
      </AddButton>
    </div>
  )
}
