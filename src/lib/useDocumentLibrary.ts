'use client'

import { useCallback, useRef, useState } from 'react'
import { Resume, ResumeDocument } from './types'
import {
  makeDocument,
  loadDocuments,
  saveDocuments,
  saveDocIndex,
  saveDocBody,
  removeDocBody,
  loadActiveId,
  saveActiveId,
  loadStorage,
  removeLegacyResume,
  uniqueName,
} from './storage'

// A pure state + localStorage-persistence store for the document library. Deliberately
// knows nothing about react-hook-form (`reset`), undo history (`seed`), or the autosave
// debounce timer — `page.tsx` orchestrates those around it. That keeps the one genuinely
// tricky bit (the switch-echo guard in `commitActiveResume`) in a single obvious place, and
// keeps this hook trivial to reason about on its own.
export function useDocumentLibrary(fallbackResume: Resume) {
  const [documents, setDocuments] = useState<ResumeDocument[]>([])
  const [activeId, setActiveIdState] = useState('')

  // Mirrors of the state above. The autosave closure (a useEffect subscription set up
  // once) reads these instead of the state directly, so it always sees the latest
  // documents/activeId without needing to re-subscribe on every change — see
  // commitActiveResume below. Every mutation in this hook goes through one of the callbacks
  // below (persist / commitActiveResume / setActive / initFromStorage / remove), and each of
  // those writes the ref synchronously in the same breath as its setState call, so the refs
  // never need a render-body sync assignment (which React's compiler disallows anyway).
  const docsRef = useRef(documents)
  const activeRef = useRef(activeId)

  const persist = useCallback((next: ResumeDocument[]) => {
    docsRef.current = next
    setDocuments(next)
    saveDocuments(next)
  }, [])

  // Runs once on mount. Loads the library from storage, migrating the old single-resume
  // autosave slot into it the first time this ever runs for a given browser. Returns the
  // resolved active document synchronously (computed locally, ahead of the queued
  // setState) so the caller can immediately reset()/seed() the form with it in the same
  // effect — mirroring the hydration pattern the single-document version used.
  const initFromStorage = useCallback((): ResumeDocument => {
    let docs = loadDocuments()
    if (!docs || docs.length === 0) {
      const legacy = loadStorage()
      const base = legacy ?? fallbackResume
      const name = base.profile.name ? `${base.profile.name}'s Resume` : 'My Resume'
      docs = [makeDocument(name, base)]
      saveDocuments(docs)
      removeLegacyResume()
    }
    const storedActiveId = loadActiveId()
    const active = docs.find((d) => d.id === storedActiveId) ?? docs[0]
    saveActiveId(active.id)
    docsRef.current = docs
    activeRef.current = active.id
    setDocuments(docs)
    setActiveIdState(active.id)
    return active
  }, [fallbackResume])

  // THE GUARD. Called from the debounced autosave settle. Writes `r` into the active
  // document ONLY if it actually differs from what's stored — so the reset() that follows a
  // document switch (which itself fires a `watch` settle) is a true no-op: no write, no
  // `updatedAt` bump, no reordering. Real edits differ, so they persist normally. Must stay
  // a stable useCallback (refs only, no reactive deps) — if it were recreated every render,
  // the autosave effect in page.tsx would re-subscribe constantly and break the debounce.
  const commitActiveResume = useCallback((r: Resume): boolean => {
    const docs = docsRef.current
    const idx = docs.findIndex((d) => d.id === activeRef.current)
    if (idx < 0) return true
    if (JSON.stringify(docs[idx].resume) === JSON.stringify(r)) return true
    const updated: ResumeDocument = { ...docs[idx], resume: r, updatedAt: Date.now() }
    const next = docs.slice()
    next[idx] = updated
    docsRef.current = next
    setDocuments(next)
    const bodyOk = saveDocBody(updated.id, updated.resume)
    const indexOk = saveDocIndex(next)
    return bodyOk && indexOk
  }, [])

  const setActive = useCallback((id: string): ResumeDocument | undefined => {
    const doc = docsRef.current.find((d) => d.id === id)
    if (!doc) return undefined
    activeRef.current = id
    setActiveIdState(id)
    saveActiveId(id)
    return doc
  }, [])

  const addDocuments = useCallback(
    (docs: ResumeDocument[]) => {
      persist([...docsRef.current, ...docs])
    },
    [persist],
  )

  const rename = useCallback(
    (id: string, name: string) => {
      persist(docsRef.current.map((d) => (d.id === id ? { ...d, name, updatedAt: Date.now() } : d)))
    },
    [persist],
  )

  const duplicate = useCallback(
    (id: string): ResumeDocument | undefined => {
      const docs = docsRef.current
      const origIdx = docs.findIndex((d) => d.id === id)
      if (origIdx < 0) return undefined
      const orig = docs[origIdx]
      const existing = new Set(docs.map((d) => d.name))
      const copy = makeDocument(uniqueName(`${orig.name} copy`, existing), orig.resume)
      persist([...docs.slice(0, origIdx + 1), copy, ...docs.slice(origIdx + 1)])
      return copy
    },
    [persist],
  )

  const createNew = useCallback((): ResumeDocument => {
    const existing = new Set(docsRef.current.map((d) => d.name))
    const doc = makeDocument(uniqueName('Untitled', existing), fallbackResume)
    persist([...docsRef.current, doc])
    return doc
  }, [fallbackResume, persist])

  // Never leaves the library empty — re-seeds a fresh document from `fallbackResume` if the
  // deletion would otherwise empty it. Returns the new active document if the deleted one
  // WAS active (so the caller can reset()/seed() the form), or null if a non-active document
  // was deleted (no form change needed). Deletion intentionally does not flush pending edits
  // first — removing a document discards whatever wasn't already autosaved to it.
  const remove = useCallback(
    (id: string): ResumeDocument | null => {
      const docs = docsRef.current
      const idx = docs.findIndex((d) => d.id === id)
      if (idx < 0) return null
      const wasActive = activeRef.current === id
      let next = docs.filter((d) => d.id !== id)
      if (next.length === 0) next = [makeDocument('My Resume', fallbackResume)]
      persist(next)
      removeDocBody(id)
      if (!wasActive) return null
      const nextActive = next[Math.min(idx, next.length - 1)]
      activeRef.current = nextActive.id
      setActiveIdState(nextActive.id)
      saveActiveId(nextActive.id)
      return nextActive
    },
    [fallbackResume, persist],
  )

  // Clears the whole library down to one fresh document — the multi-document analogue of
  // "Reset to seed data". Reuses the same never-empty invariant `remove` relies on, just
  // applied to every document at once. Explicitly removes every old document's body (not
  // just the ones `persist` would overwrite) so nothing is orphaned in localStorage.
  const deleteAll = useCallback((): ResumeDocument => {
    docsRef.current.forEach((d) => removeDocBody(d.id))
    const fresh = makeDocument('My Resume', fallbackResume)
    persist([fresh])
    activeRef.current = fresh.id
    setActiveIdState(fresh.id)
    saveActiveId(fresh.id)
    return fresh
  }, [fallbackResume, persist])

  return {
    documents,
    activeId,
    initFromStorage,
    commitActiveResume,
    setActive,
    addDocuments,
    rename,
    duplicate,
    createNew,
    remove,
    deleteAll,
  }
}
