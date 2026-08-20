import 'server-only'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogle } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import type { generateText, LanguageModel } from 'ai'
import type { ProviderId } from './providers'

// The only module that touches a vendor SDK. Adding a provider means one entry here plus one
// in providers.ts — nothing downstream (schemas, patch validation, diff review) is aware of
// which vendor answered.
//
// Every provider package types its model ids as `'known-id' | ... | (string & {})`, so the
// settings UI's custom-model field type-checks without widening anything.

/**
 * The SDK's own provider-options shape, derived from `generateText` rather than hand-rolled or
 * imported from @ai-sdk/provider-utils (a transitive package pnpm won't resolve). Stays
 * correct if the SDK changes it.
 */
export type AiProviderOptions = NonNullable<Parameters<typeof generateText>[0]['providerOptions']>

interface ProviderRuntime {
  createModel: (apiKey: string, modelId: string) => LanguageModel
  /**
   * Per-provider request options. Deliberately unset: every default model already reasons by
   * default, and shipping untuned per-vendor knobs risks 400s on providers this project can't
   * continuously test. The seam exists for when a specific need shows up.
   */
  providerOptions?: AiProviderOptions
}

export const PROVIDER_RUNTIMES: Record<ProviderId, ProviderRuntime> = {
  anthropic: {
    createModel: (apiKey, modelId) => createAnthropic({ apiKey })(modelId),
  },
  openai: {
    createModel: (apiKey, modelId) => createOpenAI({ apiKey })(modelId),
  },
  google: {
    createModel: (apiKey, modelId) => createGoogle({ apiKey })(modelId),
  },
}
