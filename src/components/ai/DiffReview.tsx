'use client'

import type { ChangeId } from '@/lib/ai/applyTailorPatch'

export interface DiffRow {
  id: ChangeId
  label: string
  current: string
  proposed: string
  rationale: string
}

/**
 * The review surface every AI edit passes through. Nothing here mutates the resume — it
 * renders proposals and reports which ones the user accepted, so "apply" stays a single
 * deliberate action rather than a side effect of generating.
 */
export function DiffReview({
  rows,
  accepted,
  onToggle,
  onSetAll,
}: {
  rows: DiffRow[]
  accepted: ReadonlySet<ChangeId>
  onToggle: (id: ChangeId) => void
  onSetAll: (next: boolean) => void
}) {
  if (rows.length === 0) return null

  const allAccepted = rows.every((r) => accepted.has(r.id))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
          Proposed changes ({rows.length})
        </span>
        <button
          type="button"
          onClick={() => onSetAll(!allAccepted)}
          className="text-xs font-medium text-brand transition-colors duration-150 hover:text-brand-600"
        >
          {allAccepted ? 'Reject all' : 'Accept all'}
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {rows.map((row) => {
          const isAccepted = accepted.has(row.id)
          return (
            <li
              key={row.id}
              className={`rounded-lg border p-2.5 transition-colors duration-150 ${
                isAccepted ? 'border-brand/40 bg-brand/5' : 'border-gray-200 bg-white'
              }`}
            >
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={isAccepted}
                  onChange={() => onToggle(row.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    {row.label}
                  </span>

                  {row.current ? (
                    <span className="text-xs leading-relaxed text-gray-400 line-through decoration-gray-300">
                      {row.current}
                    </span>
                  ) : (
                    <span className="text-xs italic text-gray-400">(empty)</span>
                  )}

                  <span className="text-xs leading-relaxed text-gray-800">{row.proposed}</span>

                  {row.rationale && (
                    <span className="text-[11px] leading-relaxed text-gray-500">
                      {row.rationale}
                    </span>
                  )}
                </div>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
