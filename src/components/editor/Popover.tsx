'use client'

import { ReactNode, useEffect, useId, useImperativeHandle, useRef, useState, forwardRef } from 'react'
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

/** Imperative handle for opening a Popover from outside its own trigger button — e.g. a
 *  row's right-click context menu, which should open the exact same panel (same
 *  positioning/flip-upward logic) as clicking its kebab trigger. */
export interface PopoverHandle {
  open: () => void
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
export const Popover = forwardRef<PopoverHandle, PopoverProps>(function Popover(
  { label, triggerContent, triggerClassName, panelClassName, align = 'end', role = 'menu', children },
  ref,
) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [openUpward, setOpenUpward] = useState(false)
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

  // Always anchors to the trigger button's own position — even when called imperatively
  // from a right-click elsewhere on a row (see `useImperativeHandle` below) — so the panel
  // opens in the same place either way, reusing this one positioning/flip-upward path.
  const openPanel = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      // The panel is always mounted (just hidden via opacity/scale — see `panel` below), so
      // its real size is measurable before we ever position it. That lets a trigger near an
      // edge of the viewport — the last row in a long, scrollable list, or a kebab near the
      // left edge of a narrow sidebar — flip/clamp the panel instead of opening off-screen.
      const margin = 8
      const panelRect = panelRef.current?.getBoundingClientRect()
      const panelHeight = panelRect?.height ?? 0
      const panelWidth = panelRect?.width ?? 0

      const spaceBelow = window.innerHeight - rect.bottom - margin
      const spaceAbove = rect.top - margin
      const upward = panelHeight > spaceBelow && panelHeight <= spaceAbove
      const top = upward
        ? rect.top - panelHeight - margin
        : Math.min(rect.bottom + margin, window.innerHeight - panelHeight - margin)

      // `align` picks which corner of the trigger the panel would naturally hang from, but
      // is clamped afterward so it always stays fully within the viewport regardless of how
      // close the trigger sits to either edge.
      const desiredLeft = align === 'end' ? rect.right - panelWidth : rect.left
      const maxLeft = Math.max(margin, window.innerWidth - panelWidth - margin)
      const left = Math.min(Math.max(desiredLeft, margin), maxLeft)

      setOpenUpward(upward)
      setCoords({ top: Math.max(margin, top), left })
    }
    setOpen(true)
  }

  const toggle = () => {
    if (open) {
      setOpen(false)
      return
    }
    openPanel()
  }

  useImperativeHandle(ref, () => ({ open: openPanel }))

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

  // Tailwind's class scanner needs each utility to appear as a complete literal string
  // somewhere in this file, so the four corner combinations are spelled out rather than
  // built via `origin-${...}-${...}` template interpolation (which it can't statically see).
  const originCls = openUpward
    ? align === 'end'
      ? 'origin-bottom-right'
      : 'origin-bottom-left'
    : align === 'end'
      ? 'origin-top-right'
      : 'origin-top-left'

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
        boxShadow: 'var(--shadow-popover)',
      }}
      className={`z-50 min-w-[11rem] ${originCls} rounded-xl bg-white p-1 transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none ${
        open
          ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
          : `pointer-events-none scale-95 opacity-0 ${openUpward ? 'translate-y-1' : '-translate-y-1'}`
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
})

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
