'use client'

import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { FormResume } from '@/lib/types'
import type { BulletVariants } from '@/lib/ai/schemas'
import { useAi } from '@/lib/ai/useAi'
import { saveAiConsent } from '@/lib/ai/settings'
import { useAiConsent } from '@/lib/ai/useAiSettings'
import { AiConsentNotice } from './AiConsentNotice'
import { IconSparkle } from '@/components/preview/primitives/Icons'

export type BulletsFieldName =
  | `experience.${number}.bullets`
  | `projects.${number}.bullets`
  | `customSections.${number}.entries.${number}.bullets`

/**
 * Per-bullet "make it stronger". Split into a hook plus two presentational pieces because the
 * trigger belongs inline with the bullet's other controls while the panel needs the full row
 * width beneath it — one component can't render into both places.
 *
 * Suggestions are never applied automatically: the user picks one, or dismisses them.
 */
export function useBulletRewriter(name: BulletsFieldName, index: number) {
  const { control, setValue } = useFormContext<FormResume>()
  const [variants, setVariants] = useState<BulletVariants['variants'] | null>(null)
  const [needsConsent, setNeedsConsent] = useState(false)
  const consented = useAiConsent()
  const ai = useAi<
    { bullet: string; context: { title: string; company: string; targetRole: string } },
    BulletVariants
  >('/api/ai/rewrite-bullet')

  const fieldName = `${name}.${index}.value` as const
  const bullet = (useWatch({ control, name: fieldName }) as string | undefined) ?? ''

  // The parent entry supplies the role context. Derived from `name` so no call site of
  // BulletsEditor has to thread it through; `company` is simply absent for projects and
  // custom sections, which have no such field.
  const parent = name.slice(0, -'.bullets'.length)
  const title = (useWatch({ control, name: `${parent}.title` as 'profile.name' }) as string) ?? ''
  const company = (useWatch({ control, name: `${parent}.company` as 'profile.name' }) as string) ?? ''
  const targetRole = (useWatch({ control, name: 'tailoredFor.position' }) as string) ?? ''

  const dismiss = () => {
    setVariants(null)
    setNeedsConsent(false)
    ai.reset()
  }

  const toggle = async () => {
    if (variants || ai.error || needsConsent) {
      dismiss()
      return
    }
    if (!bullet.trim()) return
    if (!consented) {
      setNeedsConsent(true)
      return
    }
    const result = await ai.run({ bullet, context: { title, company, targetRole } })
    if (result) setVariants(result.variants)
  }

  const accept = (text: string) => {
    setValue(fieldName, text, { shouldDirty: true })
    dismiss()
  }

  const acceptConsent = () => {
    saveAiConsent()
    setNeedsConsent(false)
  }


  return {
    expanded: Boolean(variants || ai.error || needsConsent),
    loading: ai.loading,
    error: ai.error,
    needsConsent,
    variants,
    hasText: bullet.trim().length > 0,
    toggle,
    dismiss,
    accept,
    acceptConsent,
  }
}

export type BulletRewriterState = ReturnType<typeof useBulletRewriter>

export function BulletRewriteTrigger({
  state,
  index,
}: {
  state: BulletRewriterState
  index: number
}) {
  return (
    <button
      type="button"
      onClick={state.toggle}
      disabled={state.loading || !state.hasText}
      aria-expanded={state.expanded}
      aria-label={`Suggest rewrites for bullet ${index + 1}`}
      title={state.hasText ? 'Suggest stronger rewrites' : 'Write something first'}
      className={`p-1.5 rounded transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96] disabled:opacity-30 disabled:cursor-not-allowed ${
        state.expanded ? 'text-brand bg-brand/10' : 'text-gray-500 hover:text-brand hover:bg-gray-100'
      } ${state.loading ? 'animate-pulse' : ''}`}
    >
      <IconSparkle className="w-3.5 h-3.5" />
    </button>
  )
}

export function BulletRewritePanel({ state }: { state: BulletRewriterState }) {
  if (!state.expanded) return null

  return (
    <div className="ml-5 flex flex-col gap-1.5 rounded-lg border border-gray-200 bg-gray-50 p-2">
      {state.needsConsent ? (
        <AiConsentNotice onAccept={state.acceptConsent} />
      ) : state.error ? (
        <p className="text-xs text-red-700">{state.error}</p>
      ) : (
        <>
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
            Pick a rewrite
          </span>
          {state.variants?.length === 0 && (
            <p className="text-xs text-gray-500">
              No stronger version to suggest without inventing details.
            </p>
          )}
          {state.variants?.map((v, i) => (
            <button
              key={`${v.text}-${i}`}
              type="button"
              onClick={() => state.accept(v.text)}
              className="rounded-lg border border-gray-200 bg-white p-2 text-left transition-colors duration-150 hover:border-brand hover:bg-brand/5"
            >
              <span className="block text-[11px] font-semibold text-brand">{v.angle}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-gray-800">{v.text}</span>
            </button>
          ))}
        </>
      )}
      <button
        type="button"
        onClick={state.dismiss}
        className="w-fit text-[11px] text-gray-500 transition-colors duration-150 hover:text-gray-800"
      >
        Dismiss
      </button>
    </div>
  )
}
