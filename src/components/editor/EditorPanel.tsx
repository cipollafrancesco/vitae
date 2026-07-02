'use client'

import { useEffect, useRef, useState } from 'react'
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form'
import { FormResume, FormCustomSection, Layout } from '@/lib/types'
import { moveWithin, toggleColumn, dropBefore } from '@/lib/layout'
import { ProfileForm } from './ProfileForm'
import { TailoredForForm } from './TailoredForForm'
import { ContactsForm } from './ContactsForm'
import { ExperienceForm } from './ExperienceForm'
import { EducationForm } from './EducationForm'
import { SkillsForm } from './SkillsForm'
import { ProjectsForm } from './ProjectsForm'
import { LanguagesForm } from './LanguagesForm'
import { InterestsForm } from './InterestsForm'
import { CustomSectionForm } from './CustomSectionForm'
import { SectionCard } from './SectionCard'
import { CollapsibleCard } from './CollapsibleCard'
import { AddButton } from './AddButton'

type Col = 'left' | 'right'

// A click on the preview resolves to one of these — which editor card (`id`, shared with
// `layout`) to open, and optionally which entry (index within a field-array section) or
// named field (Profile/Contacts) to scroll to + highlight. `seq` lets re-clicking the same
// element re-trigger the scroll/flash even though `id`/`entry`/`field` are unchanged.
export interface NavTarget {
  id: string
  entry?: number
  field?: string
  seq: number
}

const BUILTIN: Record<string, { label: string; node: React.ReactNode }> = {
  experience: { label: 'Work Experience', node: <ExperienceForm /> },
  education: { label: 'Education', node: <EducationForm /> },
  skills: { label: 'Skills', node: <SkillsForm /> },
  projects: { label: 'Other Projects', node: <ProjectsForm /> },
  languages: { label: 'Languages', node: <LanguagesForm /> },
  interests: { label: 'Interests', node: <InterestsForm /> },
}

export function EditorPanel({ navTarget }: { navTarget?: NavTarget | null }) {
  const { control, setValue, register } = useFormContext<FormResume>()
  const layout = (useWatch({ control, name: 'layout' }) as Layout) ?? { left: [], right: [] }
  const customSections =
    (useWatch({ control, name: 'customSections' }) as FormCustomSection[]) ?? []
  const { append, remove } = useFieldArray({ control, name: 'customSections', keyName: 'fieldId' })

  const [open, setOpen] = useState<Set<string>>(new Set(['profile']))
  const [drag, setDrag] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

  // Click-to-edit: force the target card open the instant `navTarget` changes (no-op if
  // already open). Adjusted directly during render rather than in an effect, so React opens
  // the card in the same commit instead of an extra render round-trip; `openedSeq` is the
  // "value from the previous render" this pattern compares against.
  const [openedSeq, setOpenedSeq] = useState(0)
  if (navTarget && navTarget.seq !== openedSeq) {
    setOpenedSeq(navTarget.seq)
    if (!open.has(navTarget.id)) {
      setOpen((prev) => new Set(prev).add(navTarget.id))
    }
  }

  // ...then, once its body is mounted (may take a re-render if it was just opened), scroll to
  // the specific entry/field, flash it, and focus its input. `handledSeq` guards against
  // re-running for the same navTarget once handled, while still retrying across the `open`
  // change that mounts the card body.
  const handledSeq = useRef(0)
  useEffect(() => {
    if (!navTarget || navTarget.seq === handledSeq.current) return
    const card = document.getElementById(`ed-card-${navTarget.id}`)
    if (!card) return
    handledSeq.current = navTarget.seq
    const inner =
      navTarget.entry != null
        ? card.querySelector<HTMLElement>(`[data-entry="${navTarget.entry}"]`)
        : navTarget.field
          ? card.querySelector<HTMLElement>(`[data-field="${navTarget.field}"]`)
          : null
    const el = inner ?? card
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: inner ? 'center' : 'start',
    })
    el.classList.add('ed-flash')
    setTimeout(() => el.classList.remove('ed-flash'), 1200)
    if (navTarget.field) {
      el.querySelector<HTMLElement>('input,textarea')?.focus()
    }
  }, [navTarget, open])

  const applyLayout = (next: Layout) => setValue('layout', next, { shouldDirty: true })

  const addSection = () => {
    const id = crypto.randomUUID()
    append({
      id,
      title: 'New Section',
      entries: [{ title: '', subtitle: '', dateRange: '', bullets: [{ value: '' }] }],
    })
    applyLayout({ ...layout, left: [...layout.left, id] })
    setOpen((prev) => new Set(prev).add(id))
  }

  const deleteSection = (id: string) => {
    if (!confirm('Delete this section and its content?')) return
    const idx = customSections.findIndex((c) => c.id === id)
    if (idx >= 0) remove(idx)
    applyLayout({
      left: layout.left.filter((x) => x !== id),
      right: layout.right.filter((x) => x !== id),
    })
  }

  const renderColumn = (col: Col) => {
    const ids = layout[col]
    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (drag) applyLayout(dropBefore(layout, drag, null, col))
          setDrag(null)
          setOverId(null)
        }}
        className="min-h-[44px]"
      >
        {ids.map((id, i) => {
          const isCustom = !BUILTIN[id]
          const csIndex = isCustom ? customSections.findIndex((c) => c.id === id) : -1
          if (isCustom && csIndex === -1) return null
          const sectionName = isCustom
            ? customSections[csIndex].title || 'Untitled section'
            : BUILTIN[id].label
          const label = isCustom ? (
            <input
              {...register(`customSections.${csIndex}.title`)}
              placeholder="Section title"
              aria-label="Section title"
              className="w-full px-1.5 py-0.5 rounded border border-transparent hover:border-gray-200 focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand text-sm font-semibold text-gray-700 bg-transparent"
            />
          ) : (
            <button
              type="button"
              onClick={() => toggle(id)}
              className="w-full text-left text-sm font-semibold text-gray-700 truncate"
            >
              {BUILTIN[id].label}
            </button>
          )
          return (
            <SectionCard
              key={id}
              id={`ed-card-${id}`}
              label={label}
              sectionName={sectionName}
              isOpen={open.has(id)}
              onToggle={() => toggle(id)}
              canMoveUp={i > 0}
              canMoveDown={i < ids.length - 1}
              onMoveUp={() => applyLayout(moveWithin(layout, id, -1))}
              onMoveDown={() => applyLayout(moveWithin(layout, id, 1))}
              onMoveColumn={() => applyLayout(toggleColumn(layout, id))}
              moveColumnTitle={col === 'left' ? 'Move to right column' : 'Move to left column'}
              onDelete={isCustom ? () => deleteSection(id) : undefined}
              onDragStart={(e) => {
                setDrag(id)
                if (e.dataTransfer) {
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/plain', id)
                }
              }}
              onDragEnd={() => {
                setDrag(null)
                setOverId(null)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                if (overId !== id) setOverId(id)
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (drag && drag !== id) applyLayout(dropBefore(layout, drag, id, col))
                setDrag(null)
                setOverId(null)
              }}
              isDropTarget={overId === id && drag !== null && drag !== id}
            >
              {isCustom ? <CustomSectionForm index={csIndex} /> : BUILTIN[id].node}
            </SectionCard>
          )
        })}
        {ids.length === 0 && (
          <div className="text-xs text-gray-500 border border-dashed border-gray-200 rounded-lg py-4 text-center">
            Drop a section here
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <CollapsibleCard
        id="ed-card-profile"
        label="Profile"
        isOpen={open.has('profile')}
        onToggle={() => toggle('profile')}
      >
        <ProfileForm />
      </CollapsibleCard>

      <CollapsibleCard
        id="ed-card-tailored-for"
        label="Tailored For"
        isOpen={open.has('tailored-for')}
        onToggle={() => toggle('tailored-for')}
      >
        <TailoredForForm />
      </CollapsibleCard>

      <CollapsibleCard
        id="ed-card-contacts"
        label="Contacts & Links"
        isOpen={open.has('contacts')}
        onToggle={() => toggle('contacts')}
      >
        <ContactsForm />
      </CollapsibleCard>

      <div className="p-3 flex flex-col gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5 px-0.5">
            Left column
          </div>
          {renderColumn('left')}
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5 px-0.5">
            Right column
          </div>
          {renderColumn('right')}
        </div>
        <AddButton onClick={addSection}>+ Add Section</AddButton>
      </div>
    </div>
  )
}
