'use client'

import { PROVIDERS } from '@/lib/ai/providers'
import { useAiSettings } from '@/lib/ai/useAiSettings'

/**
 * Shown once, before the first AI request of any kind. The rest of this app never sends the
 * user's resume anywhere, so the moment that changes is worth an explicit, specific heads-up
 * rather than a line buried in the README.
 */
export function AiConsentNotice({ onAccept }: { onAccept: () => void }) {
  const providerLabel = PROVIDERS[useAiSettings().provider].label

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="text-xs font-semibold text-amber-900">Before you start</p>
      <p className="text-xs leading-relaxed text-amber-900">
        Everything else in this editor stays in your browser. AI features are the exception: the
        text of your resume — and the job description you paste — is sent to {providerLabel} using
        your own API key, so they can generate suggestions. This app stores none of it, and your
        key is never saved on a server.
      </p>
      <button
        type="button"
        onClick={onAccept}
        className="w-fit rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-amber-950 active:scale-[0.96]"
      >
        Got it — continue
      </button>
    </div>
  )
}
