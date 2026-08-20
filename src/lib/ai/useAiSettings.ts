'use client'

import { useSyncExternalStore } from 'react'
import {
  aiConsentServerSnapshot,
  aiConsentSnapshot,
  aiSettingsServerSnapshot,
  aiSettingsSnapshot,
  subscribeAiStorage,
  type AiSettings,
} from './settings'

// useSyncExternalStore is the right primitive for localStorage-backed state: it renders the
// server snapshot during SSR and hydration, then swaps to the real value without the
// effect-then-setState round trip (and without React 19's set-state-in-effect warning).

export function useAiSettings(): AiSettings {
  return useSyncExternalStore(subscribeAiStorage, aiSettingsSnapshot, aiSettingsServerSnapshot)
}

export function useAiConsent(): boolean {
  return useSyncExternalStore(subscribeAiStorage, aiConsentSnapshot, aiConsentServerSnapshot)
}
