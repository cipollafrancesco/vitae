'use client'

import { useFormContext, useFieldArray } from 'react-hook-form'
import { FormResume } from '@/lib/types'
import {
  BulletRewritePanel,
  BulletRewriteTrigger,
  useBulletRewriter,
  type BulletsFieldName,
} from '@/components/ai/BulletRewriter'
import { ListControls } from './ListControls'
import { inputCls, labelCls } from './fieldStyles'

// One bullet, extracted into its own component so each can own a rewriter's state via hooks —
// they can't be called in a loop inside BulletsEditor.
function BulletRow({
  name,
  index,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onRemove,
  label,
  itemLabel,
}: {
  name: BulletsFieldName
  index: number
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  label: string
  itemLabel: string
}) {
  const { register } = useFormContext<FormResume>()
  const rewriter = useBulletRewriter(name, index)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2 items-start">
        <span className="mt-2 text-gray-500 text-xs shrink-0" aria-hidden="true">
          –
        </span>
        <textarea
          {...register(`${name}.${index}.value`)}
          rows={2}
          aria-label={`${label} ${index + 1}`}
          className={`${inputCls} resize-y flex-1`}
        />
        <BulletRewriteTrigger state={rewriter} index={index} />
        <ListControls
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onRemove={onRemove}
          itemLabel={itemLabel}
        />
      </div>
      <BulletRewritePanel state={rewriter} />
    </div>
  )
}

export function BulletsEditor({
  name,
  label = 'Bullets',
  addLabel = 'bullet',
}: {
  name: BulletsFieldName
  label?: string
  addLabel?: string
}) {
  const { control } = useFormContext<FormResume>()
  const { fields, append, remove, move } = useFieldArray({ control, name })

  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelCls}>{label}</label>
      {fields.map((f, bi) => (
        <BulletRow
          key={f.id}
          name={name}
          index={bi}
          canMoveUp={bi > 0}
          canMoveDown={bi < fields.length - 1}
          onMoveUp={() => move(bi, bi - 1)}
          onMoveDown={() => move(bi, bi + 1)}
          onRemove={() => remove(bi)}
          label={label}
          itemLabel={`${addLabel} ${bi + 1}`}
        />
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
