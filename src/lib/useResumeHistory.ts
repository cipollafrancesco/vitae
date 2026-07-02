import { useCallback, useRef, useState } from 'react'
import { UseFormReset, UseFormGetValues } from 'react-hook-form'
import { Resume, FormResume } from './types'
import { toForm, fromForm } from './storage'

// Caps memory use — history is session-only (in-memory, not persisted), so this just
// bounds how far back "Go Back" can reach within a single session.
const MAX_HISTORY = 50

// Undo/redo for the resume form. There's no reducer/store to hook into (see storage.ts) —
// the form itself (react-hook-form) is the source of truth — so history is a stack of
// whole-`Resume` snapshots restored via `reset(toForm(snapshot))`, the same "replace the
// whole form" path already used by Load Draft / Import / Reset-to-seed.
//
// The tricky part is telling apart a user edit from our own `reset` (which also fires the
// `watch` subscription that calls `record`). Rather than a fragile "programmatic reset"
// flag, `record` just dedupes against the snapshot already at the top of the stack: since
// undo/redo restore an entry that IS that snapshot, the settle that follows compares equal
// and is skipped. A genuine new edit differs, so it appends. This also gives rapid typing
// "coalesced" history entries for free, since callers only call `record` on settle (see
// page.tsx's debounced watch), not per keystroke.
export function useResumeHistory(
  reset: UseFormReset<FormResume>,
  getValues: UseFormGetValues<FormResume>,
) {
  const stack = useRef<Resume[]>([])
  const index = useRef(0)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const syncFlags = useCallback(() => {
    setCanUndo(index.current > 0)
    setCanRedo(index.current < stack.current.length - 1)
  }, [])

  // Establishes the baseline snapshot (called once, after hydration settles).
  const seed = useCallback(
    (r: Resume) => {
      stack.current = [r]
      index.current = 0
      syncFlags()
    },
    [syncFlags],
  )

  // Appends a new snapshot if it differs from the current one, dropping any redo "future"
  // and capping how far back history goes.
  const record = useCallback(
    (r: Resume) => {
      const current = stack.current[index.current]
      if (current !== undefined && JSON.stringify(current) === JSON.stringify(r)) return

      const next = stack.current.slice(0, index.current + 1)
      next.push(r)
      if (next.length > MAX_HISTORY) next.shift()
      stack.current = next
      index.current = next.length - 1
      syncFlags()
    },
    [syncFlags],
  )

  // Before moving the pointer, capture any in-flight edit that hasn't settled/debounced
  // yet, so it isn't silently lost and can still be reached via redo afterwards.
  const commitPending = useCallback(() => {
    record(fromForm(getValues()))
  }, [record, getValues])

  const undo = useCallback(() => {
    commitPending()
    if (index.current <= 0) return
    index.current -= 1
    reset(toForm(stack.current[index.current]))
    syncFlags()
  }, [commitPending, reset, syncFlags])

  const redo = useCallback(() => {
    commitPending()
    if (index.current >= stack.current.length - 1) return
    index.current += 1
    reset(toForm(stack.current[index.current]))
    syncFlags()
  }, [commitPending, reset, syncFlags])

  return { seed, record, undo, redo, canUndo, canRedo }
}
