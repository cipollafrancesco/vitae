'use client'

import { ReactNode, useId } from 'react'
import { DisclosurePanel } from './DisclosurePanel'
import { iconBtnCls, iconBtnDangerCls } from './fieldStyles'

interface Props {
  id?: string
  label: ReactNode
  sectionName: string
  isOpen: boolean
  onToggle: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onMoveColumn: () => void
  moveColumnTitle: string
  onDelete?: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  isDropTarget: boolean
  children: ReactNode
}

export function SectionCard({
  id,
  label,
  sectionName,
  isOpen,
  onToggle,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onMoveColumn,
  moveColumnTitle,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDropTarget,
  children,
}: Props) {
  const panelId = useId()
  return (
    <div
      id={id}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`card-surface bg-white rounded-lg mb-1.5 ${
        isDropTarget ? 'border-t-2 border-t-brand' : ''
      }`}
    >
      <div className="flex items-center gap-1 px-2 py-2">
        <span
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          aria-hidden="true"
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-500 px-1 select-none leading-none"
          title="Drag to reorder (or use the ▲▼⇄ buttons)"
        >
          ⠿
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="p-1.5 rounded text-gray-500 text-xs shrink-0 hover:text-gray-700 hover:bg-gray-100 transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96]"
          title={isOpen ? 'Collapse' : 'Expand'}
        >
          <span
            aria-hidden="true"
            className={`inline-block transition-transform duration-200 ease-out ${isOpen ? 'rotate-90' : ''}`}
          >
            ▸
          </span>
        </button>
        <div className="flex-1 min-w-0">{label}</div>
        <div className="flex gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label={`Move ${sectionName} up`}
            className={`${iconBtnCls} text-xs`}
            title="Move up"
          >
            <span aria-hidden="true">▲</span>
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label={`Move ${sectionName} down`}
            className={`${iconBtnCls} text-xs`}
            title="Move down"
          >
            <span aria-hidden="true">▼</span>
          </button>
          <button
            type="button"
            onClick={onMoveColumn}
            aria-label={moveColumnTitle}
            className={`${iconBtnCls} text-xs`}
            title={moveColumnTitle}
          >
            <span aria-hidden="true">⇄</span>
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Delete ${sectionName}`}
              className={`${iconBtnDangerCls} text-xs`}
              title="Delete section"
            >
              <span aria-hidden="true">✕</span>
            </button>
          )}
        </div>
      </div>
      <DisclosurePanel
        panelId={panelId}
        isOpen={isOpen}
        className="px-3 py-3 border-t border-gray-100 bg-gray-50"
      >
        {children}
      </DisclosurePanel>
    </div>
  )
}
