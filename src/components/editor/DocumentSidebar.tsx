'use client'

import { useEffect, useRef, useState } from 'react'
import { ResumeDocument } from '@/lib/types'
import { Popover, MenuItem, MenuDivider, PopoverHandle } from './Popover'
import { inputCls } from './fieldStyles'
import { IconMore, IconPlus, IconChevronLeft, IconFile } from '@/components/preview/primitives/Icons'

interface Props {
  documents: ResumeDocument[]
  activeId: string
  collapsed: boolean
  onToggleCollapse: () => void
  onSelect: (id: string) => void
  onUpload: (files: FileList) => void
  onRename: (id: string, name: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onExport: (id: string) => void
  onCreateNew: () => void
  onDeleteAll: () => void
  uploadError: string | null
  onDismissUploadError: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

const iconTriggerCls =
  'relative inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96] after:absolute after:-inset-1 after:content-[""] aria-expanded:bg-gray-100 aria-expanded:text-gray-900'

// Collapsed-rail dot colors, assigned by list position rather than hashed from the
// document's own (often shared/default) accent color — guarantees every dot is visibly
// distinct whenever the document count is within the palette, which a hash can't promise.
// Deliberately excludes the brand orange (#f26b3a) so a dot is never confused with the
// active-state ring drawn in that same color.
const DOT_PALETTE = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#84cc16', // lime
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
]

// Initials for the collapsed-rail dot, drawn from just the first word of the document's own
// name (usually the company/role a resume variant was tailored for). Splits on Unicode
// letter/number runs so punctuation doesn't leak in: "acme-pm" -> AC, "Globex — Eng Lead" ->
// GL, "Untitled (5)" -> UN.
function getInitials(name: string): string {
  const words = name.trim().match(/[\p{L}\p{N}]+/gu) ?? []
  if (words.length === 0) return '?'
  return (words[0] ?? '').slice(0, 2).toUpperCase()
}

export function DocumentSidebar({
  documents,
  activeId,
  collapsed,
  onToggleCollapse,
  onSelect,
  onUpload,
  onRename,
  onDuplicate,
  onDelete,
  onExport,
  onCreateNew,
  onDeleteAll,
  uploadError,
  onDismissUploadError,
  mobileOpen,
  onCloseMobile,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const dragCounter = useRef(0)

  const handleFiles = (files: FileList | null) => {
    if (files && files.length) onUpload(files)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const openFilePicker = () => fileRef.current?.click()

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept=".json,application/json"
      multiple
      onChange={(e) => {
        handleFiles(e.target.files)
        e.target.value = ''
      }}
      className="sr-only"
    />
  )

  return (
    <>
      {/* Desktop collapsed rail — a thin strip of accent-color dots, one per document. */}
      {collapsed && (
        <div className="hidden md:flex w-12 shrink-0 flex-col items-center gap-2 border-r border-gray-200 bg-white py-3 overflow-y-auto transition-[width] duration-200 ease-out">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand documents"
            title="Expand documents"
            className={iconTriggerCls}
          >
            <IconChevronLeft className="w-4 h-4 rotate-180" />
          </button>
          <div className="flex flex-col items-center gap-2 mt-1">
            {documents.map((doc, i) => (
              <button
                key={doc.id}
                type="button"
                title={doc.name}
                onClick={() => onSelect(doc.id)}
                aria-current={doc.id === activeId ? 'true' : undefined}
                className={`relative flex w-6 h-6 items-center justify-center rounded-full shrink-0 transition-transform duration-150 ease-out active:scale-[0.85] after:absolute after:-inset-2 after:content-[""] ${
                  doc.id === activeId ? 'ring-2 ring-offset-2 ring-brand' : 'opacity-50 hover:opacity-100'
                }`}
                style={{ backgroundColor: DOT_PALETTE[i % DOT_PALETTE.length] }}
              >
                <span className="text-[9px] font-semibold leading-none text-white">
                  {getInitials(doc.name)}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onCreateNew}
            aria-label="New document"
            title="New document"
            className={`${iconTriggerCls} mt-1 text-brand hover:bg-brand/10`}
          >
            <IconPlus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Full panel — desktop static pane (when not collapsed) and/or mobile full-screen
          overlay (when mobileOpen). On desktop the mobile-only classes are overridden by the
          md: variants; on mobile this only renders content when explicitly opened. */}
      {(!collapsed || mobileOpen) && (
        <div
          onDragEnter={(e) => {
            e.preventDefault()
            dragCounter.current += 1
            setDragActive(true)
          }}
          onDragLeave={() => {
            dragCounter.current -= 1
            if (dragCounter.current <= 0) setDragActive(false)
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`${mobileOpen ? 'flex fixed inset-0 z-40' : 'hidden'} ${
            !collapsed ? 'md:static md:z-auto md:flex md:w-[248px]' : 'md:hidden'
          } relative flex-col w-full shrink-0 border-r border-gray-200 bg-white overflow-y-auto`}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-2.5 bg-white border-b border-gray-100">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Documents
              </span>
              <span className="tabular-nums text-[11px] font-semibold text-gray-400">
                {documents.length}
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <Popover
                label="Document list actions"
                triggerContent={<IconMore className="w-4 h-4" />}
                triggerClassName={iconTriggerCls}
                panelClassName="w-52"
              >
                {(close) => (
                  <MenuItem
                    danger
                    onClick={() => {
                      onDeleteAll()
                      close()
                    }}
                  >
                    Delete all documents
                  </MenuItem>
                )}
              </Popover>
              <Popover
                label="Add document"
                triggerContent={<IconPlus className="w-4 h-4" />}
                triggerClassName={`${iconTriggerCls} text-brand hover:bg-brand/10`}
                panelClassName="w-44"
              >
                {(close) => (
                  <>
                    <MenuItem
                      onClick={() => {
                        onCreateNew()
                        close()
                      }}
                    >
                      New document
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        openFilePicker()
                        close()
                      }}
                    >
                      Upload JSON…
                    </MenuItem>
                  </>
                )}
              </Popover>
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Collapse documents"
                title="Collapse documents"
                className={`${iconTriggerCls} hidden md:inline-flex`}
              >
                <IconChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close documents"
                title="Close documents"
                className={`${iconTriggerCls} md:hidden`}
              >
                <span aria-hidden="true" className="text-base leading-none">
                  ✕
                </span>
              </button>
            </div>
          </div>

          {uploadError && (
            <div className="flex items-start justify-between gap-2 px-3 py-2 bg-red-50 text-red-700 text-xs border-b border-red-100">
              <span>{uploadError}</span>
              <button
                type="button"
                onClick={onDismissUploadError}
                aria-label="Dismiss"
                className="text-red-700 hover:text-red-900 font-semibold shrink-0"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
          )}

          <div className="flex-1 flex flex-col gap-1 p-2">
            {documents.length === 0 ? (
              <EmptyState onUpload={openFilePicker} />
            ) : (
              documents.map((doc, i) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  index={i}
                  active={doc.id === activeId}
                  renaming={renamingId === doc.id}
                  onSelect={() => onSelect(doc.id)}
                  onStartRename={() => setRenamingId(doc.id)}
                  onCommitRename={(name) => {
                    onRename(doc.id, name)
                    setRenamingId(null)
                  }}
                  onCancelRename={() => setRenamingId(null)}
                  onDuplicate={() => onDuplicate(doc.id)}
                  onExport={() => onExport(doc.id)}
                  onDelete={() => onDelete(doc.id)}
                />
              ))
            )}
          </div>

          {dragActive && (
            <div className="absolute inset-1.5 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-brand bg-brand/10 pointer-events-none">
              <span className="text-sm font-semibold text-brand">Drop to add</span>
            </div>
          )}

          {fileInput}
        </div>
      )}
    </>
  )
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center px-3 py-8">
      <IconFile className="w-8 h-8 text-gray-300" />
      <p className="text-sm font-medium text-gray-600">No documents yet</p>
      <p className="text-xs text-gray-400 text-pretty">
        Drop resume JSON files here to start tailoring for each role.
      </p>
      <button
        type="button"
        onClick={onUpload}
        className="mt-1 text-xs font-semibold text-brand hover:text-brand-600 transition-colors duration-150 ease-out"
      >
        Add JSON
      </button>
    </div>
  )
}

function DocumentRow({
  doc,
  index,
  active,
  renaming,
  onSelect,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onDuplicate,
  onExport,
  onDelete,
}: {
  doc: ResumeDocument
  index: number
  active: boolean
  renaming: boolean
  onSelect: () => void
  onStartRename: () => void
  onCommitRename: (name: string) => void
  onCancelRename: () => void
  onDuplicate: () => void
  onExport: () => void
  onDelete: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<PopoverHandle>(null)

  // Uncontrolled on purpose: the input only exists in the DOM while `renaming` is true (see
  // the conditional render below), so it remounts fresh — picking up `doc.name` via
  // `defaultValue` — every time rename mode is entered. That gives the "reset to current
  // name on open" behavior for free, with no state-sync effect needed.
  useEffect(() => {
    if (!renaming) return
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
    return () => cancelAnimationFrame(id)
  }, [renaming])

  const commit = () => {
    const trimmed = inputRef.current?.value.trim() ?? ''
    onCommitRename(trimmed || doc.name)
  }

  const role = doc.resume.profile.role || doc.resume.profile.name || 'Untitled role'

  return (
    <div
      onContextMenu={(e) => {
        if (renaming) return
        e.preventDefault()
        menuRef.current?.open()
      }}
      className={`doc-row-enter group relative flex items-center gap-2 rounded-lg pl-2.5 pr-1 py-1.5 transition-colors duration-150 ease-out ${
        active ? 'bg-brand/10' : 'hover:bg-gray-50'
      }`}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <span
        aria-hidden="true"
        className="w-[3px] self-stretch rounded-full shrink-0 transition-opacity duration-150 ease-out"
        style={{ backgroundColor: doc.resume.accentColor, opacity: active ? 1 : 0.35 }}
      />
      {renaming ? (
        <input
          ref={inputRef}
          defaultValue={doc.name}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              onCancelRename()
            }
          }}
          aria-label="Document name"
          className={`${inputCls} flex-1 min-w-0 py-1 text-sm`}
        />
      ) : (
        <button
          type="button"
          onClick={onSelect}
          aria-current={active ? 'true' : undefined}
          className="flex-1 min-w-0 text-left py-0.5"
        >
          <div
            className={`truncate text-sm ${active ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}
          >
            {doc.name}
          </div>
          <div className="truncate text-xs text-gray-500">{role}</div>
        </button>
      )}
      {!renaming && (
        <Popover
          ref={menuRef}
          label={`${doc.name} actions`}
          triggerContent={<IconMore className="w-4 h-4" />}
          triggerClassName="relative inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 hover:text-gray-700 hover:bg-gray-100 transition-[opacity,color,background-color,transform] duration-150 ease-out active:scale-[0.96] aria-expanded:opacity-100 aria-expanded:bg-gray-100 after:absolute after:-inset-1 after:content-['']"
          panelClassName="w-44"
        >
          {(close) => (
            <>
              <MenuItem
                onClick={() => {
                  onStartRename()
                  close()
                }}
              >
                Rename
              </MenuItem>
              <MenuItem
                onClick={() => {
                  onDuplicate()
                  close()
                }}
              >
                Duplicate
              </MenuItem>
              <MenuItem
                onClick={() => {
                  onExport()
                  close()
                }}
              >
                Export JSON
              </MenuItem>
              <MenuDivider />
              <MenuItem
                danger
                onClick={() => {
                  onDelete()
                  close()
                }}
              >
                Delete
              </MenuItem>
            </>
          )}
        </Popover>
      )}
    </div>
  )
}
