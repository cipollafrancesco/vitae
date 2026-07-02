'use client'

import { useFormContext, useFieldArray } from 'react-hook-form'
import { FormResume } from '@/lib/types'
import { ListControls } from './ListControls'
import { inputCls, labelCls } from './fieldStyles'

type BulletsFieldName =
  | `experience.${number}.bullets`
  | `projects.${number}.bullets`
  | `customSections.${number}.entries.${number}.bullets`

export function BulletsEditor({
  name,
  label = 'Bullets',
  addLabel = 'bullet',
}: {
  name: BulletsFieldName
  label?: string
  addLabel?: string
}) {
  const { register, control } = useFormContext<FormResume>()
  const { fields, append, remove, move } = useFieldArray({ control, name })

  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelCls}>{label}</label>
      {fields.map((f, bi) => (
        <div key={f.id} className="flex gap-2 items-start">
          <span className="mt-2 text-gray-500 text-xs shrink-0" aria-hidden="true">
            –
          </span>
          <textarea
            {...register(`${name}.${bi}.value`)}
            rows={2}
            aria-label={`${label} ${bi + 1}`}
            className={`${inputCls} resize-y flex-1`}
          />
          <ListControls
            canMoveUp={bi > 0}
            canMoveDown={bi < fields.length - 1}
            onMoveUp={() => move(bi, bi - 1)}
            onMoveDown={() => move(bi, bi + 1)}
            onRemove={() => remove(bi)}
            itemLabel={`${addLabel} ${bi + 1}`}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ value: '' })}
        className="text-xs text-brand hover:text-brand-600 text-left mt-1 transition-[color,transform] duration-150 ease-out active:scale-[0.96]"
      >
        + Add {addLabel}
      </button>
    </div>
  )
}
