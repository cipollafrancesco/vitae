import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogle } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import type { generateText, LanguageModel } from 'ai'

/**
 * The SDK's own provider-options shape, derived from `generateText` rather than hand-rolled
 * or imported from `@ai-sdk/provider-utils` (a transitive package pnpm won't resolve). Stays
 * correct if the SDK changes it.
 */
export type AiProviderOptions = NonNullable<Parameters<typeof generateText>[0]['providerOptions']>

// The only module that knows which vendor is in play. Everything downstream — the schemas,
// the patch validation, the diff review — is provider-agnostic, so adding a fourth provider
// means adding one entry here and nothing else.
//
// Model ids are typed as `... | (string & {})` by every provider package, so the custom-model
// escape hatch in the settings UI type-checks without widening anything.

export const PROVIDER_IDS = ['anthropic', 'openai', 'google'] as const
export type ProviderId = (typeof PROVIDER_IDS)[number]

export function isProviderId(v: unknown): v is ProviderId {
  return typeof v === 'string' && (PROVIDER_IDS as readonly string[]).includes(v)
}

export interface ProviderEntry {
  id: ProviderId
  label: string
  /** Suggested model ids, most capable first. `[0]` is the default for the provider. */
  suggestedModels: readonly string[]
  /** Shown as the API-key input's placeholder, so the user can tell keys apart at a glance. */
  keyHint: string
  /** Where the user goes to mint a key. */
  consoleUrl: string
  createModel: (apiKey: string, modelId: string) => LanguageModel
  /**
   * Per-provider request options. Deliberately unset: every default model here already
   * reasons by default, and shipping untuned per-vendor knobs risks 400s on providers this
   * project can't continuously test. The seam exists for when a specific need shows up.
   */
  providerOptions?: AiProviderOptions
}

export const PROVIDERS: Record<ProviderId, ProviderEntry> = {
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic',
    // The prompts in prompts.ts are tuned against claude-opus-5 — see the note there.
    suggestedModels: ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'],
    keyHint: 'sk-ant-…',
    consoleUrl: 'https://console.anthropic.com/settings/keys',
    createModel: (apiKey, modelId) => createAnthropic({ apiKey })(modelId),
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    suggestedModels: ['gpt-5.1', 'gpt-5', 'gpt-5-mini'],
    keyHint: 'sk-…',
    consoleUrl: 'https://platform.openai.com/api-keys',
    createModel: (apiKey, modelId) => createOpenAI({ apiKey })(modelId),
  },
  google: {
    id: 'google',
    label: 'Google',
    // Google's 3.x "pro" tiers are all still -preview at the pinned package version, so the
    // default is the newest stable flash; the preview pro is offered as an explicit choice.
    suggestedModels: ['gemini-3.7-flash', 'gemini-3.1-pro-preview', 'gemini-2.5-pro'],
    keyHint: 'AIza…',
    consoleUrl: 'https://aistudio.google.com/apikey',
    createModel: (apiKey, modelId) => createGoogle({ apiKey })(modelId),
  },
}

export const DEFAULT_PROVIDER: ProviderId = 'anthropic'

export function defaultModelFor(provider: ProviderId): string {
  return PROVIDERS[provider].suggestedModels[0]
}
