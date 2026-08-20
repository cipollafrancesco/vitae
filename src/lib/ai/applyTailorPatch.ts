import { Resume } from '../types'
import type { BulletPatch, TailorPatch } from './schemas'

// The trust boundary. A model — especially a smaller one on a provider this project can't
// continuously test — will occasionally address a bullet that doesn't exist, drop half the
// skills while "reordering" them, or quietly promote a gap into a bullet. None of that may
// reach the user's resume, so every patch is reconciled against the live resume here rather
// than being trusted as returned.
//
// Everything in this module is pure, so it can be exercised without a provider or a network.

/** Stable id for one reviewable change, used as the diff-review row key and accept-set member. */
export type ChangeId = string

export const SUMMARY_CHANGE_ID: ChangeId = 'summary'
export const SKILLS_CHANGE_ID: ChangeId = 'skills'
export const TAILORED_FOR_CHANGE_ID: ChangeId = 'tailoredFor'

export function bulletChangeId(p: Pick<BulletPatch, 'section' | 'entryIndex' | 'bulletIndex'>): ChangeId {
  return `${p.section}.${p.entryIndex}.${p.bulletIndex}`
}

/** Reads the bullet a patch addresses, or null if it addresses one that doesn't exist. */
export function currentBulletText(resume: Resume, p: BulletPatch): string | null {
  const entry = resume[p.section][p.entryIndex]
  if (!entry) return null
  const bullet = entry.bullets[p.bulletIndex]
  return bullet ?? null
}

/**
 * Drops bullet patches that don't address a real bullet, that propose an empty string, or
 * that propose text identical to what's already there (a no-op row is noise in the review).
 * Also de-duplicates by target: if the model emits two rewrites of the same bullet, the first
 * wins rather than the last silently overwriting it.
 */
export function usableBulletPatches(resume: Resume, patches: BulletPatch[]): BulletPatch[] {
  const seen = new Set<ChangeId>()
  return patches.filter((p) => {
    if (!Number.isInteger(p.entryIndex) || !Number.isInteger(p.bulletIndex)) return false
    const current = currentBulletText(resume, p)
    if (current === null) return false
    const proposed = p.proposed.trim()
    if (!proposed || proposed === current.trim()) return false
    const id = bulletChangeId(p)
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

/**
 * Coerces the model's `skillsOrder` into a true permutation of the resume's skills:
 * anything it invented is dropped, anything it forgot is appended in its original relative
 * order. The result always has exactly the same members as `resume.skills`, so accepting a
 * reorder can never lose a skill.
 */
export function reconcileSkillsOrder(resume: Resume, skillsOrder: string[]): string[] {
  const remaining = resume.skills.slice()
  const ordered: string[] = []

  for (const proposed of skillsOrder) {
    // Match case-insensitively on trimmed text — models routinely echo back "TypeScript" as
    // "typescript" — but keep the user's own spelling in the output.
    const key = proposed.trim().toLowerCase()
    const idx = remaining.findIndex((s) => s.trim().toLowerCase() === key)
    if (idx === -1) continue
    ordered.push(remaining[idx])
    remaining.splice(idx, 1)
  }

  return [...ordered, ...remaining]
}

/** True when the reconciled order actually differs from what the resume already has. */
export function skillsOrderChanged(resume: Resume, reconciled: string[]): boolean {
  return resume.skills.length > 1 && JSON.stringify(resume.skills) !== JSON.stringify(reconciled)
}

/**
 * Applies only the changes the user accepted, on top of the live resume.
 *
 * `patch.gaps` is intentionally unread: gaps describe what the resume does NOT support, and
 * writing them in would be the exact fabrication the prompts forbid. They are display-only.
 */
export function applyTailorPatch(
  resume: Resume,
  patch: TailorPatch,
  accepted: ReadonlySet<ChangeId>,
): Resume {
  const next: Resume = {
    ...resume,
    profile: { ...resume.profile },
    experience: resume.experience.map((e) => ({ ...e, bullets: e.bullets.slice() })),
    projects: resume.projects.map((p) => ({ ...p, bullets: p.bullets.slice() })),
    skills: resume.skills.slice(),
    tailoredFor: { ...resume.tailoredFor },
  }

  if (accepted.has(SUMMARY_CHANGE_ID) && patch.summary.proposed.trim()) {
    next.profile.summary = patch.summary.proposed.trim()
  }

  if (accepted.has(TAILORED_FOR_CHANGE_ID)) {
    next.tailoredFor = {
      company: patch.tailoredFor.company.trim(),
      position: patch.tailoredFor.position.trim(),
    }
  }

  if (accepted.has(SKILLS_CHANGE_ID)) {
    next.skills = reconcileSkillsOrder(resume, patch.skillsOrder)
  }

  // Re-filter rather than trusting the caller's set: the accepted ids came from a review
  // rendered earlier, and the resume may have been edited since.
  for (const p of usableBulletPatches(resume, patch.bullets)) {
    if (!accepted.has(bulletChangeId(p))) continue
    next[p.section][p.entryIndex].bullets[p.bulletIndex] = p.proposed.trim()
  }

  return next
}
