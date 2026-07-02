'use client'

import { ReactNode, useId } from 'react'
import { DisclosurePanel } from './DisclosurePanel'

export function CollapsibleCard({
  id,
  label,
  isOpen,
  onToggle,
  children,
}: {
  id: string
  label: ReactNode
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const panelId = useId()
  return (
    <div id={id} className="border-b border-gray-100">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>{label}</span>
        <span
          aria-hidden="true"
          className={`text-gray-500 text-xs inline-block transition-transform duration-200 ease-out ${isOpen ? 'rotate-90' : ''}`}
        >
          ▸
        </span>
      </button>
      <DisclosurePanel panelId={panelId} isOpen={isOpen} className="px-4 py-3 bg-gray-50">
        {children}
      </DisclosurePanel>
    </div>
  )
}
