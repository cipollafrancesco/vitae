'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm, FormProvider, useWatch } from 'react-hook-form'
import { FormResume } from '@/lib/types'
import { seedResume } from '@/lib/seed'
import { toForm, fromForm, loadStorage, saveStorage, saveDraft, loadDraft } from '@/lib/storage'
import { useResumeHistory } from '@/lib/useResumeHistory'
import { Toolbar } from '@/components/editor/Toolbar'
import { EditorPanel, NavTarget } from '@/components/editor/EditorPanel'
import { ResumePreview } from '@/components/preview/ResumePreview'
import { AtsResumePreview } from '@/components/preview/ats/AtsResumePreview'
import { PagedPreview } from '@/components/preview/PagedPreview'

type Mode = 'styled' | 'ats'
const MODE_KEY = 'cv-editor-mode'

export default function Page() {
  const [showPreview, setShowPreview] = useState(false)
  const [mode, setMode] = useState<Mode>('styled')
  const [draftJson, setDraftJson] = useState<string | null>(null)
  const [navTarget, setNavTarget] = useState<NavTarget | null>(null)
  const [saveError, setSaveError] = useState(false)
  const navSeq = useRef(0)

  const methods = useForm<FormResume>({
    defaultValues: toForm(seedResume),
  })

  const { control, watch, reset, getValues } = methods
  const { seed, record, undo, redo, canUndo, canRedo } = useResumeHistory(reset, getValues)

  useEffect(() => {
    const stored = loadStorage()
    const initial = stored ?? seedResume
    if (stored) reset(toForm(stored))
    seed(fromForm(toForm(initial)))
    const savedMode = localStorage.getItem(MODE_KEY)
    if (savedMode === 'ats' || savedMode === 'styled') setMode(savedMode)
    const draft = loadDraft()
    if (draft) setDraftJson(JSON.stringify(fromForm(toForm(draft))))
  }, [reset, seed])

  const handleSaveDraft = () => {
    const r = fromForm(getValues())
    if (!saveDraft(r)) {
      alert(
        'Could not save draft — your browser storage may be full. Try removing the photo and try again.',
      )
      return
    }
    setDraftJson(JSON.stringify(r))
  }

  const handleLoadDraft = () => {
    const draft = loadDraft()
    if (!draft) return
    if (!confirm('Load saved draft? This replaces your current edits.')) return
    reset(toForm(draft))
    setDraftJson(JSON.stringify(fromForm(toForm(draft))))
  }

  const handleModeChange = (next: Mode) => {
    setMode(next)
    localStorage.setItem(MODE_KEY, next)
  }

  // Click-to-edit: a click anywhere in the preview resolves to the editor card (`data-rp-section`)
  // it came from, plus an optional entry index / named field, via one delegated listener — the
  // on-screen preview (PagedPreview) renders the whole resume once per page frame, so a single
  // listener on the pane (rather than per-node handlers) avoids duplicating it N times.
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const sectionEl = target.closest<HTMLElement>('[data-rp-section]')
    if (!sectionEl) return
    const entryEl = target.closest<HTMLElement>('[data-rp-entry]')
    const fieldEl = target.closest<HTMLElement>('[data-rp-field]')
    setNavTarget({
      id: sectionEl.dataset.rpSection!,
      entry: entryEl ? Number(entryEl.dataset.rpEntry) : undefined,
      field: fieldEl?.dataset.rpField,
      seq: ++navSeq.current,
    })
    setShowPreview(false)
  }

  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    const sub = watch((values) => {
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        const r = fromForm(values as FormResume)
        setSaveError(!saveStorage(r))
        record(r)
      }, 600)
    })
    return () => {
      sub.unsubscribe()
      clearTimeout(saveTimer.current)
    }
  }, [watch, record])

  const formValues = useWatch({ control }) as FormResume
  const resume = fromForm(formValues)

  const draftExists = draftJson !== null
  const hasUnsavedChanges = draftExists && JSON.stringify(resume) !== draftJson

  const preview =
    mode === 'ats' ? <AtsResumePreview resume={resume} /> : <ResumePreview resume={resume} />

  return (
    <FormProvider {...methods}>
      <div className="no-print flex flex-col h-screen overflow-hidden">
        <Toolbar
          mode={mode}
          onModeChange={handleModeChange}
          onSaveDraft={handleSaveDraft}
          onLoadDraft={handleLoadDraft}
          hasUnsavedChanges={hasUnsavedChanges}
          draftExists={draftExists}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />

        {saveError && (
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-red-50 text-red-700 text-xs border-b border-red-100">
            <span>
              Couldn&apos;t save your changes locally — storage may be full. Try removing the photo,
              or export a backup.
            </span>
            <button
              type="button"
              onClick={() => setSaveError(false)}
              aria-label="Dismiss"
              className="text-red-700 hover:text-red-900 font-semibold shrink-0"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          <div
            className={`${showPreview ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-[420px] shrink-0 border-r border-gray-200 overflow-y-auto bg-white`}
          >
            <EditorPanel navTarget={navTarget} />
          </div>

          <div
            onClick={handlePreviewClick}
            className={`${!showPreview ? 'hidden' : 'flex'} md:flex flex-1 overflow-auto preview-bg p-8 items-start justify-center`}
          >
            <PagedPreview mode={mode} resume={resume} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="md:hidden fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-full bg-brand hover:bg-brand-600 text-white text-sm font-semibold shadow-lg transition-[background-color,transform] duration-150 ease-out active:scale-[0.96]"
        >
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>

      <div className="print-only">{preview}</div>
    </FormProvider>
  )
}
