'use client'

import type { MatchReport } from '@/lib/ai/schemas'

function scoreTone(score: number): string {
  if (score >= 70) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (score >= 40) return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-red-700 bg-red-50 border-red-200'
}

/** Read-only. Nothing here can change the resume — that's the point of running it first. */
export function MatchReportView({ report }: { report: MatchReport }) {
  const critical = report.missing.filter((m) => m.severity === 'critical')
  const niceToHave = report.missing.filter((m) => m.severity !== 'critical')

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border ${scoreTone(report.score)}`}
        >
          <span className="text-lg font-bold tabular-nums leading-none">{report.score}</span>
          <span className="text-[10px] font-medium opacity-70">/ 100</span>
        </div>
        <p className="flex-1 text-xs leading-relaxed text-gray-700">{report.verdict}</p>
      </div>

      {report.matched.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
            Already covered
          </span>
          <div className="flex flex-wrap gap-1">
            {report.matched.map((m, i) => (
              <span
                key={`${m}-${i}`}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-800"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {[
        { title: 'Missing — critical', items: critical },
        { title: 'Missing — nice to have', items: niceToHave },
      ]
        .filter((g) => g.items.length > 0)
        .map((group) => (
          <div key={group.title} className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
              {group.title}
            </span>
            <ul className="flex flex-col gap-1.5">
              {group.items.map((gap, i) => (
                <li
                  key={`${gap.requirement}-${i}`}
                  className="rounded-lg border border-gray-200 bg-white p-2"
                >
                  <span className="text-xs font-semibold text-gray-800">{gap.requirement}</span>
                  {gap.note && (
                    <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">{gap.note}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

      <p className="text-[11px] leading-relaxed text-gray-400">
        Gaps are never written into your resume — tailoring only re-angles what you already
        wrote.
      </p>
    </div>
  )
}
