'use client'

import { ReactNode, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface PopoverProps {
  /** Accessible name for the trigger button (also used as its native title/tooltip). */
  label: string
  triggerContent: ReactNode
  triggerClassName?: string
  panelClassName?: string
  align?: 'start' | 'end'
  role?: 'menu' | 'dialog'
  /** Panel content. Pass a function to get a `close()` you can call after an action. */
  children: ReactNode | ((close: () => void) => ReactNode)
}

// Reusable trigger + floating panel shared by the toolbar's "More actions" menu and its
// "Style" settings popover. The panel is kept mounted at all times and toggled via
// opacity/scale/translate classes so both the enter AND exit animate — the CSS cross-fade
// approach, since this project has no motion library (see DisclosurePanel.tsx for the same
// "stay mounted, animate via classes" idea applied to the accordion).
//
// The panel is portaled to <body> and positioned with `fixed` coordinates rather than being
// an `absolute` child of the trigger. The toolbar row scrolls horizontally on narrow screens
// (`overflow-x-auto`), and CSS coerces an unset overflow-y to `auto` whenever overflow-x is
// non-visible — so an in-flow absolute child tall enough to poke out the bottom would silently
// turn the whole toolbar into its own vertical scroll container. Portaling sidesteps that (and
// any future clipping ancestor) entirely.
export function Popover({
  label,
  triggerContent,
  triggerClassName,
  panelClassName,
  align = 'end',
  role = 'menu',
  children,
}: PopoverProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left?: number; right?: number }>({ top: 0 })
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  // Server has no `document`, so SSR renders without the portal. The client's *first*
  // hydration pass must match that exactly, or React throws a hydration-mismatch error —
  // so this flips to true only after mount, in an effect, once hydration is already done.
  // This is the standard SSR-safe pattern for portal-based UI (Radix, Headless UI, etc. all
  // do the same); the lint rule's general "don't setState in an effect" advice doesn't fit
  // this specific case, since there is no way to know we're past hydration without one.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const close = () => setOpen(false)

  const toggle = () => {
    if (open) {
      setOpen(false)
      return
    }
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      setCoords(
        align === 'end'
          ? { top: rect.bottom + 8, right: window.innerWidth - rect.right }
          : { top: rect.bottom + 8, left: rect.left },
      )
    }
    setOpen(true)
  }

  // Outside click / Escape / resize dismissal. Escape returns focus to the trigger so
  // keyboard users don't lose their place. Resize closes rather than reflow, since these
  // menus are short-lived.
  useEffect(() => {
    if (!open) return

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    const handleResize = () => setOpen(false)

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
    }
  }, [open])

  // Move focus into the panel when it opens.
  useEffect(() => {
    if (!open) return
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
      '[role="menuitem"]:not(:disabled), button:not(:disabled), input, a[href]',
    )
    firstFocusable?.focus()
  }, [open])

  // Basic roving focus for menu items (Up/Down). Form controls inside the Style popover
  // simply don't match the selector, so this no-ops there.
  const handlePanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const items = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? [],
    )
    if (!items.length) return
    e.preventDefault()
    const currentIndex = items.indexOf(document.activeElement as HTMLElement)
    const nextIndex =
      e.key === 'ArrowDown'
        ? (currentIndex + 1) % items.length
        : (currentIndex - 1 + items.length) % items.length
    items[nextIndex]?.focus()
  }

  const panel = (
    <div
      id={panelId}
      ref={panelRef}
      role={role}
      aria-hidden={!open}
      inert={!open}
      onKeyDown={handlePanelKeyDown}
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        right: coords.right,
        boxShadow: 'var(--shadow-popover)',
      }}
      className={`z-50 min-w-[11rem] origin-top-right rounded-xl bg-white p-1 transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none ${
        open
          ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
      } ${panelClassName ?? ''}`}
    >
      {typeof children === 'function' ? children(close) : children}
    </div>
  )

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        title={label}
        onClick={toggle}
        className={triggerClassName}
      >
        {triggerContent}
      </button>
      {mounted && createPortal(panel, document.body)}
    </div>
  )
}

export function MenuItem({
  children,
  onClick,
  danger,
  disabled,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'
      } ${className ?? ''}`}
    >
      {children}
    </button>
  )
}

export function MenuDivider() {
  return <div role="separator" className="my-1 h-px bg-gray-100" />
}
