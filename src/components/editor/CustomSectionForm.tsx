'use client'

import { useFormContext, useFieldArray } from 'react-hook-form'
import { FormResume } from '@/lib/types'
import { ListControls } from './ListControls'
import { Field } from './Field'
import { BulletsEditor } from './BulletsEditor'
import { AddButton } from './AddButton'

function Entry({ secIndex, index, total }: { secIndex: number; index: number; total: number }) {
  const { control } = useFormContext<FormResume>()
  const { remove, move } = useFieldArray({ control, name: `customSections.${secIndex}.entries` })
  const itemLabel = `entry ${index + 1}`

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
      <Field
        label="Title"
        name={`customSections.${secIndex}.entries.${index}.title`}
        placeholder="e.g. AWS Certified Solutions Architect"
      />
      <Field
        label="Subtitle / Issuer"
        name={`customSections.${secIndex}.entries.${index}.subtitle`}
        placeholder="e.g. Amazon Web Services"
      />
      <Field
        label="Date"
        name={`customSections.${secIndex}.entries.${index}.dateRange`}
        placeholder="e.g. 2024"
      />
      <BulletsEditor
        name={`customSections.${secIndex}.entries.${index}.bullets`}
        label="Details (optional)"
        addLabel="detail"
      />
    </div>
  )
}

export function CustomSectionForm({ index }: { index: number }) {
  const { control } = useFormContext<FormResume>()
  const { fields, append } = useFieldArray({ control, name: `customSections.${index}.entries` })

  return (
    <div className="flex flex-col gap-3">
      {fields.map((f, i) => (
        <Entry key={f.id} secIndex={index} index={i} total={fields.length} />
      ))}
      <AddButton
        onClick={() => append({ title: '', subtitle: '', dateRange: '', bullets: [{ value: '' }] })}
      >
        + Add entry
      </AddButton>
    </div>
  )
}
