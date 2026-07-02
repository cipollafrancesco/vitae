'use client'

import { useId, useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormResume } from '@/lib/types'
import { fromForm, toForm, exportJson, exportText } from '@/lib/storage'
import { seedResume } from '@/lib/seed'
import { IconUndo, IconRedo, IconMore, IconSliders } from '@/components/preview/primitives/Icons'
import { Popover, MenuItem, MenuDivider } from '@/components/editor/Popover'

type Mode = 'styled' | 'ats'

interface Props {
  mode: Mode
  onModeChange: (m: Mode) => void
  onSaveDraft: () => void
  onLoadDraft: () => void
  hasUnsavedChanges: boolean
  draftExists: boolean
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  /** Adds one or more resume JSON files to the document library (does not replace the
   *  currently active document in place — see DocumentSidebar / useDocumentLibrary). */
  onImport: (files: FileList) => void
}

export function Toolbar({
  mode,
  onModeChange,
  onSaveDraft,
  onLoadDraft,
  hasUnsavedChanges,
  draftExists,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onImport,
}: Props) {
  const { getValues, reset, register } = useFormContext<FormResume>()
  const fileRef = useRef<HTMLInputElement>(null)
  const accentId = useId()

  const handleExport = () => exportJson(fromForm(getValues()))

  const handleExportTxt = () => exportText(fromForm(getValues()))

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) onImport(e.target.files)
    e.target.value = ''
  }

  const handlePrint = () => {
    // Chrome derives the "Save as PDF" filename from document.title, so set it to
    // CV_{Full Name}_{STYLED|ATS} just for the print, then restore it afterwards.
    const name = getValues('profile.name')?.trim() || 'Resume'
    const label = mode === 'ats' ? 'ATS' : 'STYLED'
    const prev = document.title
    const restore = () => {
      document.title = prev
      window.removeEventListener('afterprint', restore)
    }
    window.addEventListener('afterprint', restore)
    document.title = `CV_${name}_${label}`
    window.print()
  }

  const handleReset = () => {
    if (confirm('Reset to seed data? All changes will be lost.')) {
      reset(toForm(seedResume))
    }
  }

  const btnCls =
    'px-3.5 py-2 rounded-lg text-xs font-semibold transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96]'

  // Pure-icon triggers (Undo/Redo/More) render as a 36px box; the `after:` pseudo-element
  // grows the actual hit area to 40px on each side without inflating the visible toolbar.
  // Adjacent triggers sit `gap-1` (4px) apart, so the 2px extension on each side just meets
  // in the middle — no overlapping hit areas.
  const iconTriggerCls =
    'relative inline-flex items-center justify-center p-2.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-300 disabled:cursor-not-allowed transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96] after:absolute after:-inset-0.5 after:content-[""] aria-expanded:bg-gray-100 aria-expanded:text-gray-900'

  const styleTriggerCls =
    'inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96] aria-expanded:bg-gray-100 aria-expanded:text-gray-900'

  return (
    <div className="no-print flex items-center gap-1.5 px-4 py-2.5 bg-white border-b border-gray-200 shrink-0 flex-nowrap overflow-x-auto">
      <img src="/vitae-logo-white.png" alt="Vitae" className="h-6 w-auto mr-1 shrink-0" />

      <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden shrink-0">
        <button
          type="button"
          onClick={() => onModeChange('styled')}
          aria-pressed={mode === 'styled'}
          className={`px-3 py-2 text-xs font-medium transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96] ${
            mode === 'styled' ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Styled
        </button>
        <button
          type="button"
          onClick={() => onModeChange('ats')}
          aria-pressed={mode === 'ats'}
          className={`px-3 py-2 text-xs font-medium border-l border-gray-200 transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96] ${
            mode === 'ats' ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          ATS
        </button>
      </div>

      <div className="flex items-center gap-1 ml-auto shrink-0">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Go back"
          title="Go back"
          className={iconTriggerCls}
        >
          <IconUndo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Go forward"
          title="Go forward"
          className={iconTriggerCls}
        >
          <IconRedo className="w-4 h-4" />
        </button>

        {mode === 'styled' && (
          <Popover
            label="Style settings"
            triggerContent={
              <>
                <IconSliders className="w-4 h-4" />
                <span className="hidden sm:inline">Style</span>
              </>
            }
            triggerClassName={styleTriggerCls}
            panelClassName="w-56"
          >
            <div className="flex items-center justify-between gap-3 px-2 py-1.5">
              <label htmlFor={accentId} className="text-xs font-medium text-gray-600">
                Accent color
              </label>
              <input
                id={accentId}
                type="color"
                {...register('accentColor')}
                className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0.5 bg-white"
                title="Accent color"
              />
            </div>
            <label
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer select-none hover:bg-gray-50"
              title="Show each date range on the same line as its title"
            >
              <input
                type="checkbox"
                {...register('dateInline')}
                className="w-4 h-4 accent-brand cursor-pointer"
              />
              <span className="text-xs text-gray-600">Date on title line</span>
            </label>
          </Popover>
        )}

        <button
          type="button"
          onClick={handlePrint}
          className={`${btnCls} bg-brand hover:bg-brand-600 text-white`}
        >
          Export PDF
        </button>

        <button
          type="button"
          onClick={onSaveDraft}
          className={`${btnCls} relative bg-gray-800 hover:bg-gray-900 text-white`}
        >
          {hasUnsavedChanges && (
            <span
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-brand"
              title="Unsaved changes since last draft"
            />
          )}
          Save Draft
        </button>

        <Popover
          label="More actions"
          triggerContent={<IconMore className="w-4 h-4" />}
          triggerClassName={iconTriggerCls}
          panelClassName="w-52"
        >
          {(close) => (
            <>
              <MenuItem
                onClick={() => {
                  handleExport()
                  close()
                }}
              >
                Export JSON
              </MenuItem>
              {mode === 'ats' && (
                <MenuItem
                  onClick={() => {
                    handleExportTxt()
                    close()
                  }}
                >
                  Export TXT
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  fileRef.current?.click()
                  close()
                }}
              >
                Add document(s)…
              </MenuItem>
              <MenuItem
                disabled={!draftExists}
                onClick={() => {
                  onLoadDraft()
                  close()
                }}
              >
                Load Draft
              </MenuItem>
              <MenuDivider />
              <MenuItem
                danger
                onClick={() => {
                  handleReset()
                  close()
                }}
              >
                Reset to seed data
              </MenuItem>
            </>
          )}
        </Popover>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        multiple
        onChange={handleImport}
        className="sr-only"
      />
    </div>
  )
}
