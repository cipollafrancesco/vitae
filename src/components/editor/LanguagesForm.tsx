'use client'

import { useFormContext, useFieldArray } from 'react-hook-form'
import { FormResume } from '@/lib/types'
import { ListControls } from './ListControls'
import { Field } from './Field'
import { AddButton } from './AddButton'

function LanguageEntry({ index, total }: { index: number; total: number }) {
  const { control } = useFormContext<FormResume>()
  const { remove, move } = useFieldArray({ control, name: 'languages' })
  const itemLabel = `language ${index + 1}`

  return (
    <div className="card-surface rounded-lg p-3 flex flex-col gap-2 bg-white" data-entry={index}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-500">Language {index + 1}</span>
        <ListControls
          canMoveUp={index > 0}
          canMoveDown={index < total - 1}
          onMoveUp={() => move(index, index - 1)}
          onMoveDown={() => move(index, index + 1)}
          onRemove={() => remove(index)}
          itemLabel={itemLabel}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Language" name={`languages.${index}.name`} />
        <Field
          label="Proficiency"
          name={`languages.${index}.level`}
          placeholder="Native, Fluent…"
        />
      </div>
    </div>
  )
}

export function LanguagesForm() {
  const { control } = useFormContext<FormResume>()
  const { fields, append } = useFieldArray({ control, name: 'languages' })

  return (
    <div className="flex flex-col gap-3">
      {fields.map((f, i) => (
        <LanguageEntry key={f.id} index={i} total={fields.length} />
      ))}
      <AddButton onClick={() => append({ name: '', level: '' })}>+ Add language</AddButton>
    </div>
  )
}
