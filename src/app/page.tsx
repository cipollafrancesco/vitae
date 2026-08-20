'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm, FormProvider, useWatch } from 'react-hook-form'
import { FormResume } from '@/lib/types'
import { seedResume } from '@/lib/seed'
import {
  toForm,
  fromForm,
  saveDraft,
  loadDraft,
  importJson,
  exportJson,
  makeDocument,
  deriveName,
  uniqueName,
  loadDocsCollapsed,
  saveDocsCollapsed,
} from '@/lib/storage'
import { useResumeHistory } from '@/lib/useResumeHistory'
import { useDocumentLibrary } from '@/lib/useDocumentLibrary'
import { Toolbar } from '@/components/editor/Toolbar'
import { EditorPanel, NavTarget } from '@/components/editor/EditorPanel'
import { DocumentSidebar } from '@/components/editor/DocumentSidebar'
import { IconFile } from '@/components/preview/primitives/Icons'
import { TailorPanel, TailorApplyRequest } from '@/components/ai/TailorPanel'
import { ResumePreview } from '@/components/preview/ResumePreview'
import { AtsResumePreview } from '@/components/preview/ats/AtsResumePreview'
import { PagedPreview } from '@/components/preview/PagedPreview'

type Mode = 'styled' | 'ats'
const MODE_KEY = 'cv-editor-mode'

export default function Page() {
  const [showPreview, setShowPreview] = useState(false)
  const [showTailor, setShowTailor] = useState(false)
  const [showDocs, setShowDocs] = useState(false)
  const [docsCollapsed, setDocsCollapsed] = useState(false)
  const [mode, setMode] = useState<Mode>('styled')
  const [draftJson, setDraftJson] = useState<string | null>(null)
  const [navTarget, setNavTarget] = useState<NavTarget | null>(null)
  const [saveError, setSaveError] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const navSeq = useRef(0)

  const methods = useForm<FormResume>({
    defaultValues: toForm(seedResume),
  })

  const { control, watch, reset, getValues } = methods
  const { seed, record, undo, redo, canUndo, canRedo } = useResumeHistory(reset, getValues)
  const lib = useDocumentLibrary(seedResume)

  useEffect(() => {
    const active = lib.initFromStorage()
    reset(toForm(active.resume))
    seed(fromForm(toForm(active.resume)))
    const savedMode = localStorage.getItem(MODE_KEY)
    if (savedMode === 'ats' || savedMode === 'styled') setMode(savedMode)
    const draft = loadDraft()
    if (draft) setDraftJson(JSON.stringify(fromForm(toForm(draft))))
    setDocsCollapsed(loadDocsCollapsed())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, seed, lib.initFromStorage])

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

  const handleToggleDocsCollapse = () => {
    setDocsCollapsed((prev) => {
      const next = !prev
      saveDocsCollapsed(next)
      return next
    })
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
        setSaveError(!lib.commitActiveResume(r))
        record(r)
      }, 600)
    })
    return () => {
      sub.unsubscribe()
      clearTimeout(saveTimer.current)
    }
    // `lib` is a fresh object every render; depending on it wholesale would re-subscribe
    // this effect (and reset the debounce) on every keystroke. `commitActiveResume` is a
    // stable useCallback (see useDocumentLibrary.ts), so depending on it alone is correct.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, record, lib.commitActiveResume])

  // Persists whatever hasn't settled into a save yet — cancelling the pending timer FIRST is
  // essential: a timer left running from before a document switch would otherwise fire after
  // the active id changes and write the old document's edits into the new one.
  const flushPendingSave = () => {
    clearTimeout(saveTimer.current)
    setSaveError(!lib.commitActiveResume(fromForm(getValues())))
  }

  const handleSelect = (id: string) => {
    setShowDocs(false)
    if (id === lib.activeId) return
    flushPendingSave()
    const doc = lib.setActive(id)
    if (!doc) return
    reset(toForm(doc.resume))
    seed(fromForm(toForm(doc.resume)))
  }

  const handleUpload = async (files: FileList) => {
    const results = await Promise.allSettled(
      Array.from(files).map(async (f) => ({ name: deriveName(f.name), resume: await importJson(f) })),
    )
    const ok = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
    const failedCount = results.length - ok.length
    if (!ok.length) {
      setUploadError('None of those files were valid resume JSON.')
      return
    }
    const existingNames = new Set(lib.documents.map((d) => d.name))
    const docs = ok.map(({ name, resume }) => {
      const unique = uniqueName(name, existingNames)
      existingNames.add(unique)
      return makeDocument(unique, resume)
    })
    lib.addDocuments(docs)
    handleSelect(docs[0].id)
    setUploadError(
      failedCount ? `Skipped ${failedCount} invalid file${failedCount > 1 ? 's' : ''}.` : null,
    )
  }

  const handleRename = (id: string, name: string) => lib.rename(id, name)

  const handleDuplicate = (id: string) => {
    if (id === lib.activeId) flushPendingSave()
    const doc = lib.duplicate(id)
    if (doc) handleSelect(doc.id)
  }

  // Applying AI suggestions goes through the same "replace the whole form" path as Load Draft,
  // import, and undo — so the debounced watch records it into useResumeHistory and a single
  // Undo reverts the whole application, with no extra bookkeeping here.
  const handleApplyTailor = ({ resume: next, documentName, asNewDocument }: TailorApplyRequest) => {
    setShowTailor(false)

    if (!asNewDocument) {
      reset(toForm(next))
      return
    }

    // Duplicating first keeps the original variant byte-identical; the copy is what receives
    // the accepted changes. flushPendingSave mirrors handleDuplicate — a timer left running
    // from before the switch would otherwise write these edits into the wrong document.
    flushPendingSave()
    const doc = lib.duplicate(lib.activeId)
    if (!doc) {
      reset(toForm(next))
      return
    }
    if (documentName) {
      const unique = uniqueName(
        documentName,
        new Set(lib.documents.filter((d) => d.id !== doc.id).map((d) => d.name)),
      )
      lib.rename(doc.id, unique)
    }
    handleSelect(doc.id)
    reset(toForm(next))
  }

  const handleDeleteDoc = (id: string) => {
    const doc = lib.documents.find((d) => d.id === id)
    if (!doc) return
    if (!confirm(`Delete "${doc.name}"? This can't be undone.`)) return
    const nextActive = lib.remove(id)
    if (nextActive) {
      reset(toForm(nextActive.resume))
      seed(fromForm(toForm(nextActive.resume)))
    }
  }

  const handleExportDoc = (id: string) => {
    const doc = lib.documents.find((d) => d.id === id)
    if (doc) exportJson(doc.resume)
  }

  const handleCreateDoc = () => {
    const doc = lib.createNew()
    handleSelect(doc.id)
  }

  const handleDeleteAllDocs = () => {
    const count = lib.documents.length
    if (!confirm(`Delete all ${count} document${count === 1 ? '' : 's'}? This can't be undone.`)) return
    const fresh = lib.deleteAll()
    reset(toForm(fresh.resume))
    seed(fromForm(toForm(fresh.resume)))
  }

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
          onImport={handleUpload}
          onOpenTailor={() => setShowTailor(true)}
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
          <DocumentSidebar
            documents={lib.documents}
            activeId={lib.activeId}
            collapsed={docsCollapsed}
            onToggleCollapse={handleToggleDocsCollapse}
            onSelect={handleSelect}
            onUpload={handleUpload}
            onRename={handleRename}
            onDuplicate={handleDuplicate}
            onDelete={handleDeleteDoc}
            onExport={handleExportDoc}
            onCreateNew={handleCreateDoc}
            onDeleteAll={handleDeleteAllDocs}
            uploadError={uploadError}
            onDismissUploadError={() => setUploadError(null)}
            mobileOpen={showDocs}
            onCloseMobile={() => setShowDocs(false)}
          />

          <div
            className={`${showPreview || showDocs ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-[420px] shrink-0 border-r border-gray-200 overflow-y-auto bg-white`}
          >
            <EditorPanel navTarget={navTarget} />
          </div>

          <div
            onClick={handlePreviewClick}
            className={`${!showPreview || showDocs ? 'hidden' : 'flex'} md:flex flex-1 overflow-auto preview-bg p-8 items-start justify-center`}
          >
            <PagedPreview mode={mode} resume={resume} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowDocs(true)}
          className="md:hidden fixed bottom-5 left-5 z-50 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-semibold shadow-lg transition-[background-color,transform] duration-150 ease-out active:scale-[0.96]"
        >
          <IconFile className="w-4 h-4" />
          <span className="tabular-nums">{lib.documents.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="md:hidden fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-full bg-brand hover:bg-brand-600 text-white text-sm font-semibold shadow-lg transition-[background-color,transform] duration-150 ease-out active:scale-[0.96]"
        >
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>

      <TailorPanel
        resume={resume}
        open={showTailor}
        onClose={() => setShowTailor(false)}
        onApply={handleApplyTailor}
      />

      <div className="print-only">{preview}</div>
    </FormProvider>
  )
}
