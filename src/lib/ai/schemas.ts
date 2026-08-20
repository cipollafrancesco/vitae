import { z } from 'zod'
import { resumeSchema } from '../types'
import { PROVIDER_IDS } from './providers'

// ============================================================
// Model output schemas
// ============================================================
// These are the contract the model must satisfy. They are deliberately *narrow*: the model
// never emits a whole Resume, only an index-addressed patch over the one the user already
// has. That keeps untouched fields structurally unreachable, makes the diff review a direct
// render of the response, and means a malformed generation degrades to "fewer suggestions"
// rather than a clobbered resume.

export const bulletPatchSchema = z.object({
  section: z.enum(['experience', 'projects']),
  entryIndex: z.number().int(),
  bulletIndex: z.number().int(),
  proposed: z.string(),
  rationale: z.string(),
})

export const gapSchema = z.object({
  requirement: z.string(),
  severity: z.enum(['critical', 'nice-to-have']),
  note: z.string(),
})

export const tailorPatchSchema = z.object({
  /** Suggested name for the resulting document, e.g. "Acme — Senior PM". */
  documentName: z.string(),
  tailoredFor: z.object({ company: z.string(), position: z.string() }),
  summary: z.object({ proposed: z.string(), rationale: z.string() }),
  bullets: z.array(bulletPatchSchema),
  /** A permutation of the resume's existing skills. Coerced to one in applyTailorPatch. */
  skillsOrder: z.array(z.string()),
  /** Display-only. Never written into the resume — see applyTailorPatch. */
  gaps: z.array(gapSchema),
})

export const matchReportSchema = z.object({
  /** 0–100. Clamped on the way out, since models drift past the stated range. */
  score: z.number(),
  verdict: z.string(),
  matched: z.array(z.string()),
  missing: z.array(gapSchema),
})

export const bulletVariantsSchema = z.object({
  variants: z.array(z.object({ text: z.string(), angle: z.string() })),
})

export type BulletPatch = z.infer<typeof bulletPatchSchema>
export type Gap = z.infer<typeof gapSchema>
export type TailorPatch = z.infer<typeof tailorPatchSchema>
export type MatchReport = z.infer<typeof matchReportSchema>
export type BulletVariants = z.infer<typeof bulletVariantsSchema>

// ============================================================
// Request body schemas (validated at the route boundary)
// ============================================================

export const providerIdSchema = z.enum(PROVIDER_IDS)

/** Job descriptions are user-pasted; cap them so one paste can't blow up a context window. */
const jobDescriptionSchema = z.string().trim().min(1).max(20000)

export const tailorRequestSchema = z.object({
  resume: resumeSchema,
  jobDescription: jobDescriptionSchema,
})

export const matchRequestSchema = z.object({
  resume: resumeSchema,
  jobDescription: jobDescriptionSchema,
})

export const rewriteBulletRequestSchema = z.object({
  bullet: z.string().trim().min(1).max(2000),
  context: z.object({
    title: z.string().default(''),
    company: z.string().default(''),
    targetRole: z.string().default(''),
  }),
})
