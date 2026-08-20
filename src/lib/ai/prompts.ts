import { Resume } from '../types'
import { resumeToText } from '../atsText'

// One prompt set, tuned against the default provider (claude-opus-5). Non-default providers
// run the same text rather than a per-vendor variant — an N×prompt matrix isn't worth the
// maintenance at this scale. That's why the validation in applyTailorPatch.ts is strict: it,
// not the prompt, is what keeps a weaker model from corrupting a resume.

// The rule that matters most. A resume that claims something the user can't back up in an
// interview is worse than one that's merely under-optimised, so fabrication is framed as the
// single hard failure, with an explicit escape hatch (the gaps list) for everything the model
// wants to add but can't support.
const NO_FABRICATION = `
HARD RULE — never invent anything. You may only re-angle, re-emphasise, reorder, tighten, and
reword content that is already present in the resume. You must not add a skill, tool,
technology, metric, employer, date, credential, or responsibility that does not already appear
there. Do not invent numbers: if a bullet has no metric, it stays without one. Do not
extrapolate seniority or scope beyond what is written.

If the job description asks for something the resume does not support, that belongs in the
"gaps" list, never in the resume itself. A short honest resume beats an impressive false one —
the person has to defend every line of this in an interview.
`.trim()

const BULLET_CRAFT = `
Good resume bullets lead with a strong, concrete action verb, name the scope or the thing
acted on, and land on an outcome. Prefer specific over grand. Keep each bullet to one or two
lines. Avoid first person ("I", "my"), avoid filler ("responsible for", "helped with",
"worked on"), and avoid stacking adjectives.
`.trim()

export const TAILOR_SYSTEM = `
You are an expert resume editor helping someone adapt their existing CV to a specific job
posting.

${NO_FABRICATION}

${BULLET_CRAFT}

How to work:
- Rewrite the professional summary so it speaks directly to this role, using only the person's
  real background.
- Propose rewrites only for bullets you genuinely improve for THIS posting. Leave a bullet
  alone rather than churning it — a change with no clear reason is noise in the review.
- Reorder the existing skills so the ones this posting cares about come first. The list must
  contain exactly the skills already present, reordered — never add, never drop.
- Fill "tailoredFor" with the company and position from the posting, and suggest a short
  "documentName" like "Acme — Senior PM" for this variant.
- Use "gaps" for real requirements the resume does not evidence. Mark a gap "critical" when
  the posting treats it as a hard requirement, "nice-to-have" otherwise.
- Every rewrite needs a one-sentence "rationale" naming what in the posting motivated it. The
  user reads these to decide accept or reject, so be concrete, not flattering.
`.trim()

export const MATCH_SYSTEM = `
You are an expert technical recruiter assessing how well a candidate's resume matches a job
posting. You are reviewing only — you do not rewrite anything.

Be honest and calibrated. An inflated score is useless to someone deciding whether to spend an
evening on an application. Judge on evidence actually present in the resume; do not assume
adjacent experience implies a requirement is met.

- "score": 0–100, how well this resume, as written, answers this posting.
- "verdict": one or two plain sentences — is this worth applying to, and what is the single
  biggest thing standing in the way?
- "matched": concrete requirements from the posting that the resume already evidences.
- "missing": requirements it does not evidence. Mark "critical" when the posting treats it as
  a hard requirement, "nice-to-have" otherwise. In "note", say what the resume shows instead,
  where that's useful.
`.trim()

export const REWRITE_BULLET_SYSTEM = `
You are an expert resume editor improving a single bullet point.

${NO_FABRICATION}

${BULLET_CRAFT}

Return exactly three variants of the bullet, each taking a genuinely different angle — for
example one leading with impact, one with scope or scale, one with the technical approach.
Do not return three rephrasings of the same sentence. If the original bullet lacks the detail
an angle would need, cover a different angle instead of inventing the detail.

Give each variant a two-to-four word "angle" label (e.g. "Impact first", "Scope and scale")
so the user can tell them apart at a glance.
`.trim()

/**
 * The payload for tailoring and matching. `resumeToText` already produces a complete, clean
 * serialization of the resume, so it carries the prose; the indexed listing after it is what
 * lets the model address individual bullets in its patch.
 */
export function resumeContext(resume: Resume): string {
  const lines: string[] = [resumeToText(resume), '', '--- ADDRESSABLE BULLETS ---']

  const listSection = (section: 'experience' | 'projects') => {
    resume[section].forEach((entry, entryIndex) => {
      const heading =
        section === 'experience'
          ? `${(entry as Resume['experience'][number]).title} @ ${(entry as Resume['experience'][number]).company}`
          : (entry as Resume['projects'][number]).title
      lines.push(`${section}[${entryIndex}] — ${heading}`)
      entry.bullets.forEach((b, bulletIndex) => {
        lines.push(`  ${section}[${entryIndex}].bullets[${bulletIndex}]: ${b}`)
      })
    })
  }

  listSection('experience')
  listSection('projects')

  lines.push('', '--- CURRENT SKILLS (reorder only, do not add or drop) ---')
  lines.push(resume.skills.join(', ') || '(none)')

  return lines.join('\n')
}

export function tailorPrompt(resume: Resume, jobDescription: string): string {
  return [
    '--- JOB DESCRIPTION ---',
    jobDescription,
    '',
    '--- CANDIDATE RESUME ---',
    resumeContext(resume),
  ].join('\n')
}

export function matchPrompt(resume: Resume, jobDescription: string): string {
  return [
    '--- JOB DESCRIPTION ---',
    jobDescription,
    '',
    '--- CANDIDATE RESUME ---',
    resumeToText(resume),
  ].join('\n')
}

export function rewriteBulletPrompt(
  bullet: string,
  context: { title: string; company: string; targetRole: string },
): string {
  const where = [context.title, context.company].filter(Boolean).join(' @ ')
  return [
    where ? `Role this bullet belongs to: ${where}` : null,
    context.targetRole ? `The resume is being aimed at: ${context.targetRole}` : null,
    '',
    'Bullet to improve:',
    bullet,
  ]
    .filter((l) => l !== null)
    .join('\n')
}
