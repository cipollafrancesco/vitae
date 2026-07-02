'use client'

import { ReactNode, useState } from 'react'

// Content stays mounted once opened (never re-collapses out of the DOM) so the grid-rows
// transition below always has real content to animate against, while a never-opened panel
// mounts nothing — the same lazy-mount behavior the accordion had before it needed to animate.
// `hasOpened` is adjusted during render (React's documented pattern for a monotonic latch
// derived from a prop) rather than in an effect, so the very first open still mounts and
// animates within the same commit.
export function DisclosurePanel({
  panelId,
  isOpen,
  className,
  children,
}: {
  panelId: string
  isOpen: boolean
  className: string
  children: ReactNode
}) {
  const [hasOpened, setHasOpened] = useState(isOpen)
  if (isOpen && !hasOpened) setHasOpened(true)
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div id={panelId} inert={!isOpen} className="overflow-hidden">
        {hasOpened && <div className={className}>{children}</div>}
      </div>
    </div>
  )
}
