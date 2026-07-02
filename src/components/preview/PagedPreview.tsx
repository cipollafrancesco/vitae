'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { Resume } from '@/lib/types'
import { ResumePreview } from './ResumePreview'
import { AtsResumePreview } from './ats/AtsResumePreview'

type Mode = 'styled' | 'ats'

// Blocks that must not be split across a page break (both columns considered together).
const ATOMIC = [
  '.rp-header',
  '.rp-contact-bar',
  '.rp-section-header',
  '.rp-exp-entry',
  '.rp-edu-entry',
  '.rp-project-entry',
  '.rp-language-entry',
  '.rp-pills-wrap',
  '.ats-entry',
  '.ats-h',
].join(',')

// Greedy pagination that never cuts through an atomic block: each page fills up to
// pageHeight, then the break is pulled back before any block it would slice, repeating
// until it lands in a gap across BOTH columns (pulling back can newly straddle another
// block). A single block taller than a page is hard-cut (unavoidable).
function computeStarts(
  blocks: { top: number; bottom: number }[],
  contentH: number,
  ph: number,
): number[] {
  const EPS = 0.5
  const starts = [0]
  let pageStart = 0
  let guard = 0
  while (pageStart + ph < contentH - EPS && guard++ < 500) {
    let breakAt = pageStart + ph
    for (let pass = 0; pass <= blocks.length; pass++) {
      let straddled = false
      for (const b of blocks) {
        if (b.top < breakAt - EPS && b.bottom > breakAt + EPS) {
          breakAt = b.top
          straddled = true
        }
      }
      if (!straddled) break
    }
    if (breakAt <= pageStart + EPS) breakAt = pageStart + ph // block taller than a page: hard-cut
    starts.push(breakAt)
    pageStart = breakAt
  }
  return starts
}

const sameArray = (a: number[], b: number[]) =>
  a.length === b.length && a.every((v, i) => v === b[i])

// Screen-only paged preview: stacked white A4 frames (PDF-viewer look). Each frame clips
// the same preview translated up to its page slice; breaks respect entry boundaries so no
// entry/heading is sliced in half. The print path (`.print-only`) is untouched.
export function PagedPreview({ mode, resume }: { mode: Mode; resume: Resume }) {
  const renderPreview = () =>
    mode === 'ats' ? <AtsResumePreview resume={resume} /> : <ResumePreview resume={resume} />

  // Per-page vertical sheet margin, matching the printed PDF (PrintSheet thead/tfoot spacers).
  const marginMm = mode === 'ats' ? 16 : 9

  const measureRef = useRef<HTMLDivElement>(null)
  const refRef = useRef<HTMLDivElement>(null)
  const [pageHPx, setPageHPx] = useState(0)
  const [contentH, setContentH] = useState(0)
  const [starts, setStarts] = useState<number[]>([0])

  // Reads the current DOM (which already reflects the latest mode/resume). State updates are
  // guarded to no-op when unchanged, so the "run after every render" effect below can't loop.
  const recompute = useCallback(() => {
    const content = measureRef.current
    const onePage = refRef.current
    if (!content || !onePage) return
    const ph = onePage.getBoundingClientRect().height
    const crect = content.getBoundingClientRect()
    const ch = crect.height
    if (ph <= 0 || ch <= 0) return
    const blocks: { top: number; bottom: number }[] = []
    content.querySelectorAll(ATOMIC).forEach((el) => {
      const r = el.getBoundingClientRect()
      let bottom = r.bottom - crect.top
      // break-after: avoid — keep a section header glued to its first following entry so it's
      // never stranded alone at the bottom of a page (mirrors the print CSS).
      if (el.matches('.rp-section-header, .ats-h')) {
        const section = el.closest('.rp-section, .ats-section')
        const first = section?.querySelector(
          '.rp-exp-entry, .rp-edu-entry, .rp-project-entry, .rp-language-entry, .rp-pills-wrap, .ats-entry',
        )
        if (first) bottom = Math.max(bottom, first.getBoundingClientRect().bottom - crect.top)
      }
      blocks.push({ top: r.top - crect.top, bottom })
    })
    blocks.sort((a, b) => a.top - b.top)
    // Fill each page to the usable area (page minus top+bottom margins), so content clears the
    // per-page margins and the on-screen page breaks match the exported PDF.
    const usable = ph - 2 * marginMm * (ph / 297)
    const next = computeStarts(blocks, ch, usable)
    setPageHPx((prev) => (prev === ph ? prev : ph))
    setContentH((prev) => (prev === ch ? prev : ch))
    setStarts((prev) => (sameArray(prev, next) ? prev : next))
  }, [marginMm])

  // Re-measure after every render (catches mode switches and live edits).
  useLayoutEffect(() => {
    recompute()
  })

  // Catch async reflows that don't trigger a React render: web-font load + window resize.
  useLayoutEffect(() => {
    const content = measureRef.current
    const onePage = refRef.current
    if (!content || !onePage) return
    const raf = requestAnimationFrame(recompute)
    if (document.fonts?.ready) document.fonts.ready.then(recompute)
    const ro = new ResizeObserver(recompute)
    ro.observe(content)
    ro.observe(onePage)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [recompute])

  return (
    <div className="paged-preview">
      <div ref={refRef} className="paged-ref" aria-hidden />
      <div ref={measureRef} className="paged-measure" aria-hidden>
        {renderPreview()}
      </div>
      {starts.map((start, i) => {
        const end = i + 1 < starts.length ? starts[i + 1] : contentH
        return (
          <div key={i} className="paged-page" style={{ padding: `${marginMm}mm 0` }}>
            <div
              className="paged-clip"
              style={pageHPx ? { height: Math.max(0, end - start) } : undefined}
            >
              <div style={pageHPx ? { transform: `translateY(${-start}px)` } : undefined}>
                {renderPreview()}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
