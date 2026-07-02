import {
  Resume,
  FormResume,
  FormExperience,
  FormProject,
  FormCustomSection,
  FormCustomEntry,
  resumeSchema,
} from './types'
import { resumeToText } from './atsText'
import { normalizeLayout, DEFAULT_LAYOUT } from './layout'

const STORAGE_KEY = 'cv-editor-resume'
const DRAFT_KEY = 'cv-editor-draft'

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
