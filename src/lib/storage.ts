import {
  Resume,
  ResumeDocument,
  FormResume,
  FormExperience,
  FormProject,
  FormCustomSection,
  FormCustomEntry,
  resumeSchema,
  documentMetaListSchema,
} from './types'
import { resumeToText } from './atsText'
import { normalizeLayout, DEFAULT_LAYOUT } from './layout'

const STORAGE_KEY = 'cv-editor-resume'
const DRAFT_KEY = 'cv-editor-draft'
const DOCS_INDEX_KEY = 'cv-editor-documents'
const ACTIVE_ID_KEY = 'cv-editor-active-id'
const DOCS_COLLAPSED_KEY = 'cv-editor-docs-collapsed'
const docBodyKey = (id: string) => `cv-editor-doc-${id}`

export function toForm(r: Resume): FormResume {
  return {
    ...r,
    skills: r.skills.map((v) => ({ value: v })),
    interests: r.interests.map((v) => ({ value: v })),
    experience: r.experience.map((e): FormExperience => ({
      ...e,
      bullets: e.bullets.map((b) => ({ value: b })),
    })),
    projects: r.projects.map((p): FormProject => ({
      ...p,
      bullets: p.bullets.map((b) => ({ value: b })),
    })),
    customSections: (r.customSections ?? []).map((c): FormCustomSection => ({
      ...c,
      entries: c.entries.map((e): FormCustomEntry => ({
        ...e,
        bullets: e.bullets.map((b) => ({ value: b })),
      })),
    })),
    layout: normalizeLayout(
      r.layout,
      (r.customSections ?? []).map((c) => c.id),
    ),
  }
}

export function fromForm(safe: Partial<FormResume>): Resume {
  return {
    accentColor: safe.accentColor ?? '#292929',
    profile: safe.profile ?? {
      name: '',
      role: '',
      summary: '',
      photoUrl: '',
      showPhoto: true,
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      github: '',
    },
    skills: (safe.skills ?? []).map((s) => s.value),
    interests: (safe.interests ?? []).map((i) => i.value),
    experience: (safe.experience ?? []).map((e) => ({
      ...e,
      bullets: (e.bullets ?? []).map((b) => b.value),
    })),
    education: safe.education ?? [],
    projects: (safe.projects ?? []).map((p) => ({
      ...p,
      bullets: (p.bullets ?? []).map((b) => b.value),
    })),
    languages: safe.languages ?? [],
    customSections: (safe.customSections ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      entries: (c.entries ?? []).map((e) => ({
        title: e.title,
        subtitle: e.subtitle,
        dateRange: e.dateRange,
        bullets: (e.bullets ?? []).map((b) => b.value),
      })),
    })),
    layout: safe.layout ?? DEFAULT_LAYOUT,
    dateInline: safe.dateInline ?? false,
    tailoredFor: safe.tailoredFor ?? { company: '', position: '' },
  }
}

export function loadStorage(): Resume | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return resumeSchema.parse(parsed)
  } catch {
    return null
  }
}

// Returns false (instead of throwing) when the write fails — most commonly a full
// localStorage quota, which a multi-megabyte embedded photo can hit. Callers decide how
// to surface that to the user; we don't want a storage hiccup to crash the editor.
export function saveStorage(r: Resume): boolean {
  if (typeof window === 'undefined') return true
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(r))
    return true
  } catch {
    return false
  }
}

export function saveDraft(r: Resume): boolean {
  if (typeof window === 'undefined') return true
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(r))
    return true
  } catch {
    return false
  }
}

export function loadDraft(): Resume | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return resumeSchema.parse(parsed)
  } catch {
    return null
  }
}

function downloadBlob(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportJson(r: Resume): void {
  downloadBlob(
    JSON.stringify(r, null, 2),
    `resume-${new Date().toISOString().slice(0, 10)}.json`,
    'application/json',
  )
}

export function exportText(r: Resume): void {
  downloadBlob(
    resumeToText(r),
    `resume-ats-${new Date().toISOString().slice(0, 10)}.txt`,
    'text/plain',
  )
}

export async function importJson(file: File): Promise<Resume> {
  const text = await file.text()
  const parsed = JSON.parse(text)
  return resumeSchema.parse(parsed)
}

// ============================================================
// Document library — multiple resumes, switchable
// ============================================================
// Storage is split in two: a small index (`cv-editor-documents`, one `DocumentMeta` per
// document) that drives the sidebar list, and one heavy body per document
// (`cv-editor-doc-<id>`, the full `Resume` — can carry a multi-hundred-KB base64 photo).
// Autosave (every 600ms) only needs to touch the ACTIVE document, so this split lets it
// rewrite just that one body + the tiny index, instead of re-serializing every document's
// photo on every keystroke settle.

export function makeDocument(name: string, resume: Resume): ResumeDocument {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    name,
    // Normalized the same way the form round-trips it, so a freshly-loaded document's
    // `fromForm(watch(...))` compares byte-equal to what's stored — see commitActiveResume
    // in useDocumentLibrary.ts, which relies on that equality to no-op the post-switch settle.
    resume: fromForm(toForm(resume)),
    createdAt: now,
    updatedAt: now,
  }
}

function docToMeta(doc: ResumeDocument) {
  return {
    id: doc.id,
    name: doc.name,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    accentColor: doc.resume.accentColor,
  }
}

export function saveDocIndex(docs: ResumeDocument[]): boolean {
  if (typeof window === 'undefined') return true
  try {
    localStorage.setItem(DOCS_INDEX_KEY, JSON.stringify(docs.map(docToMeta)))
    return true
  } catch {
    return false
  }
}

export function saveDocBody(id: string, resume: Resume): boolean {
  if (typeof window === 'undefined') return true
  try {
    localStorage.setItem(docBodyKey(id), JSON.stringify(resume))
    return true
  } catch {
    return false
  }
}

export function removeDocBody(id: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(docBodyKey(id))
}

// Bulk write (index + every body) — used for whole-library mutations (upload, delete,
// rename, duplicate, create). The 600ms autosave path uses the narrower saveDocBody +
// saveDocIndex instead, so it never re-touches documents that didn't change.
export function saveDocuments(docs: ResumeDocument[]): boolean {
  const indexOk = saveDocIndex(docs)
  const bodiesOk = docs.map((d) => saveDocBody(d.id, d.resume)).every(Boolean)
  return indexOk && bodiesOk
}

export function loadDocuments(): ResumeDocument[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(DOCS_INDEX_KEY)
    if (!raw) return null
    const metas = documentMetaListSchema.parse(JSON.parse(raw))
    const docs: ResumeDocument[] = []
    for (const meta of metas) {
      const bodyRaw = localStorage.getItem(docBodyKey(meta.id))
      if (!bodyRaw) continue
      try {
        const resume = resumeSchema.parse(JSON.parse(bodyRaw))
        docs.push({ id: meta.id, name: meta.name, resume, createdAt: meta.createdAt, updatedAt: meta.updatedAt })
      } catch {
        continue
      }
    }
    return docs.length ? docs : null
  } catch {
    return null
  }
}

export function loadActiveId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACTIVE_ID_KEY)
}

export function saveActiveId(id: string): boolean {
  if (typeof window === 'undefined') return true
  try {
    localStorage.setItem(ACTIVE_ID_KEY, id)
    return true
  } catch {
    return false
  }
}

export function loadDocsCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(DOCS_COLLAPSED_KEY) === '1'
}

export function saveDocsCollapsed(collapsed: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DOCS_COLLAPSED_KEY, collapsed ? '1' : '0')
}

// Deletes the pre-multi-document autosave slot after its one-time migration into the
// document library (see useDocumentLibrary.ts's initFromStorage) — nothing else reads it.
export function removeLegacyResume(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

export function deriveName(filename: string): string {
  const stripped = filename.replace(/\.json$/i, '').trim()
  return stripped || 'Resume'
}

export function uniqueName(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base
  let n = 2
  while (existing.has(`${base} (${n})`)) n++
  return `${base} (${n})`
}
