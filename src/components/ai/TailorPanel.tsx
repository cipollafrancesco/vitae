'use client'

import { useMemo, useState } from 'react'
import { Resume } from '@/lib/types'
import {
  applyTailorPatch,
  bulletChangeId,
  currentBulletText,
  reconcileSkillsOrder,
  skillsOrderChanged,
  usableBulletPatches,
  type ChangeId,
  SKILLS_CHANGE_ID,
  SUMMARY_CHANGE_ID,
  TAILORED_FOR_CHANGE_ID,
} from '@/lib/ai/applyTailorPatch'
import type { MatchReport, TailorPatch } from '@/lib/ai/schemas'
import { useAi } from '@/lib/ai/useAi'
import { hasKey, saveAiConsent } from '@/lib/ai/settings'
import { useAiConsent, useAiSettings } from '@/lib/ai/useAiSettings'
import { AiConsentNotice } from './AiConsentNotice'
import { AiSettingsForm } from './AiSettingsForm'
import { DiffReview, type DiffRow } from './DiffReview'
import { MatchReportView } from './MatchReportView'
import { inputCls } from '@/components/editor/fieldStyles'

export interface TailorApplyRequest {
  resume: Resume
  documentName: string
  asNewDocument: boolean
}

/**
 * Paste a job description, see how the resume scores against it, then review proposed edits one
 * by one. The panel owns the review state; applying is delegated upward to page.tsx, which owns
 * the form and the document library.
 */
export function TailorPanel({
  resume,
  open,
  onClose,
  onApply,
}: {
  resume: Resume
  open: boolean
  onClose: () => void
  onApply: (request: TailorApplyRequest) => void
}) {
  const [jobDescription, setJobDescription] = useState('')
  const [report, setReport] = useState<MatchReport | null>(null)
  const [patch, setPatch] = useState<TailorPatch | null>(null)
  const [accepted, setAccepted] = useState<Set<ChangeId>>(new Set())
  const [asNewDocument, setAsNewDocument] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  // Both come from the shared store, so pasting a key in the settings section below clears the
  // "no API key" prompt without any refresh plumbing.
  const consented = useAiConsent()
  const keyMissing = !hasKey(useAiSettings())

  const match = useAi<{ resume: Resume; jobDescription: string }, MatchReport>('/api/ai/match')
  const tailor = useAi<{ resume: Resume; jobDescription: string }, TailorPatch>('/api/ai/tailor')

  // Rows are derived from the LIVE resume, never from the model's echo of it, so the review
  // always shows what the user actually has — even if they edited between generating and
  // applying.
  const rows: DiffRow[] = useMemo(() => {
    if (!patch) return []
    const out: DiffRow[] = []

    if (patch.summary.proposed.trim() && patch.summary.proposed.trim() !== resume.profile.summary.trim()) {
      out.push({
        id: SUMMARY_CHANGE_ID,
        label: 'Summary',
        current: resume.profile.summary,
        proposed: patch.summary.proposed.trim(),
        rationale: patch.summary.rationale,
      })
    }

    const tailoredCompany = patch.tailoredFor.company.trim()
    const tailoredPosition = patch.tailoredFor.position.trim()
    if (
      (tailoredCompany || tailoredPosition) &&
      (tailoredCompany !== resume.tailoredFor.company || tailoredPosition !== resume.tailoredFor.position)
    ) {
      const format = (c: string, p: string) => [p, c].filter(Boolean).join(' @ ')
      out.push({
        id: TAILORED_FOR_CHANGE_ID,
        label: 'Tailored for (private note)',
        current: format(resume.tailoredFor.company, resume.tailoredFor.position),
        proposed: format(tailoredCompany, tailoredPosition),
        rationale: 'Records which posting this variant targets. Never shown on the resume.',
      })
    }

    const reconciledSkills = reconcileSkillsOrder(resume, patch.skillsOrder)
    if (skillsOrderChanged(resume, reconciledSkills)) {
      out.push({
        id: SKILLS_CHANGE_ID,
        label: 'Skills order',
        current: resume.skills.join(', '),
        proposed: reconciledSkills.join(', '),
        rationale: 'Same skills, reordered so the ones this posting asks for come first.',
      })
    }

    for (const p of usableBulletPatches(resume, patch.bullets)) {
      const label = p.section === 'experience'
        ? `${resume.experience[p.entryIndex].title} @ ${resume.experience[p.entryIndex].company}`
        : resume.projects[p.entryIndex].title
      out.push({
        id: bulletChangeId(p),
        label: label || (p.section === 'experience' ? 'Experience' : 'Project'),
        current: currentBulletText(resume, p) ?? '',
        proposed: p.proposed.trim(),
        rationale: p.rationale,
      })
    }

    return out
  }, [patch, resume])

  if (!open) return null

  const busy = match.loading || tailor.loading
  const canSubmit = jobDescription.trim().length > 0 && !busy && consented

  const runMatch = async () => {
    const result = await match.run({ resume, jobDescription: jobDescription.trim() })
    if (result) setReport(result)
  }

  const runTailor = async () => {
    const result = await tailor.run({ resume, jobDescription: jobDescription.trim() })
    if (result) {
      setPatch(result)
      setAccepted(new Set())
    }
  }

  const toggle = (id: ChangeId) =>
    setAccepted((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

  const setAll = (on: boolean) => setAccepted(on ? new Set(rows.map((r) => r.id)) : new Set())

  const handleApply = () => {
    if (!patch || accepted.size === 0) return
    onApply({
      resume: applyTailorPatch(resume, patch, accepted),
      documentName: patch.documentName.trim(),
      asNewDocument,
    })
  }

  const error = match.error ?? tailor.error

  return (
    <div className="no-print fixed inset-0 z-50 flex items-stretch justify-end bg-black/30">
      {/* Clicking the backdrop closes; the panel stops propagation so inner clicks don't. */}
      <div className="flex-1" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tailor to a job description"
        className="flex w-full max-w-[480px] flex-col overflow-y-auto bg-white shadow-xl"
      >
        <div className="sticky top-0 flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-800">Tailor to a job description</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowSettings((v) => !v)}
              aria-expanded={showSettings}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900"
            >
              AI settings
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg px-2 py-1.5 text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4">
          {showSettings && (
            <div className="rounded-lg border border-gray-200 p-2">
              <AiSettingsForm />
            </div>
          )}

          {!consented && <AiConsentNotice onAccept={saveAiConsent} />}

          {keyMissing && !showSettings && (
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-left text-xs text-amber-900 transition-colors duration-150 hover:bg-amber-100"
            >
              No API key set yet — add one in AI settings to use these features.
            </button>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="jd-input" className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
              Job description
            </label>
            <textarea
              id="jd-input"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              placeholder="Paste the full job posting here…"
              className={`${inputCls} resize-y`}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={runMatch}
              disabled={!canSubmit}
              className="flex-1 rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 transition-[background-color,transform] duration-150 ease-out hover:bg-gray-50 active:scale-[0.96] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
            >
              {match.loading ? 'Checking…' : 'Check match'}
            </button>
            <button
              type="button"
              onClick={runTailor}
              disabled={!canSubmit}
              className="flex-1 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-600 active:scale-[0.96] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
            >
              {tailor.loading ? 'Tailoring…' : 'Tailor resume'}
            </button>
          </div>

          {error && (
            <p className="rounded-lg border border-red-100 bg-red-50 p-2.5 text-xs text-red-700">
              {error}
            </p>
          )}

          {report && <MatchReportView report={report} />}

          {patch && rows.length === 0 && (
            <p className="rounded-lg border border-gray-200 p-2.5 text-xs text-gray-500">
              No changes proposed — your resume already reads as well as it can for this posting
              without inventing anything.
            </p>
          )}

          <DiffReview rows={rows} accepted={accepted} onToggle={toggle} onSetAll={setAll} />
        </div>

        {rows.length > 0 && (
          <div className="sticky bottom-0 flex shrink-0 flex-col gap-2 border-t border-gray-200 bg-white px-4 py-3">
            <label className="flex cursor-pointer select-none items-center gap-2">
              <input
                type="checkbox"
                checked={asNewDocument}
                onChange={(e) => setAsNewDocument(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-brand"
              />
              <span className="text-xs text-gray-600">
                Apply to a new document, keeping this one untouched
              </span>
            </label>
            <button
              type="button"
              onClick={handleApply}
              disabled={accepted.size === 0}
              className="rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-600 active:scale-[0.96] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
            >
              {accepted.size === 0
                ? 'Select changes to apply'
                : `Apply ${accepted.size} change${accepted.size === 1 ? '' : 's'}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
