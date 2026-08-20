'use client'

import { useCallback, useRef, useState } from 'react'
import { API_KEY_HEADER, MODEL_HEADER, PROVIDER_HEADER } from './headers'
import { loadAiSettings } from './settings'

// One call in flight per hook instance. Settings are read at call time rather than captured in
// state, so a key pasted in the settings popover is picked up by the very next request without
// any cross-component plumbing.

export interface AiCallState {
  loading: boolean
  error: string | null
}

export function useAi<TRequest, TResponse>(endpoint: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Lets a superseded response be discarded: if the user fires a second request before the
  // first lands, only the newest may write state.
  const seq = useRef(0)

  const run = useCallback(
    async (body: TRequest): Promise<TResponse | null> => {
      const mine = ++seq.current
      const settings = loadAiSettings()
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [PROVIDER_HEADER]: settings.provider,
            [MODEL_HEADER]: settings.model,
            [API_KEY_HEADER]: settings.apiKey.trim(),
          },
          body: JSON.stringify(body),
        })

        const payload: unknown = await res.json().catch(() => null)
        if (mine !== seq.current) return null

        if (!res.ok) {
          const message =
            payload && typeof payload === 'object' && typeof (payload as { error?: unknown }).error === 'string'
              ? (payload as { error: string }).error
              : 'Something went wrong generating suggestions.'
          setError(message)
          return null
        }

        return payload as TResponse
      } catch {
        if (mine !== seq.current) return null
        setError('Could not reach the AI service. Check your connection and try again.')
        return null
      } finally {
        if (mine === seq.current) setLoading(false)
      }
    },
    [endpoint],
  )

  const reset = useCallback(() => setError(null), [])

  return { run, loading, error, reset }
}
