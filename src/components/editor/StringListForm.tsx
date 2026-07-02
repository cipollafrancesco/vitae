'use client'

import { useFormContext, useFieldArray } from 'react-hook-form'
import { FormResume } from '@/lib/types'
import { ListControls } from './ListControls'
import { AddButton } from './AddButton'
import { inputInlineCls } from './fieldStyles'

export function StringListForm({
  name,
  itemLabel,
  placeholder,
}: {
  name: 'skills' | 'interests'
  itemLabel: string
  placeholder?: string
}) {
  const { register, control } = useFormContext<FormResume>()
  const { fields, append, remove, move } = useFieldArray({ control, name })

  return (
    <div className="flex flex-col gap-2">
      {fields.map((f, i) => (
        <div key={f.id} className="flex gap-2 items-center" data-entry={i}>
          <input
            {...register(`${name}.${i}.value`)}
            className={inputInlineCls}
            placeholder={placeholder}
            aria-label={`${itemLabel} ${i + 1}`}
          />
          <ListControls
            canMoveUp={i > 0}
            canMoveDown={i < fields.length - 1}
            onMoveUp={() => move(i, i - 1)}
            onMoveDown={() => move(i, i + 1)}
            onRemove={() => remove(i)}
            itemLabel={`${itemLabel.toLowerCase()} ${i + 1}`}
          />
        </div>
      ))}
      <AddButton onClick={() => append({ value: '' })}>+ Add {itemLabel.toLowerCase()}</AddButton>
    </div>
  )
}
