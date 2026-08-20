// Client-safe provider metadata. Deliberately imports none of the @ai-sdk/* packages: the
// settings UI needs labels, model suggestions, and key hints, and pulling the SDKs in here
// would ship all three vendor clients to the browser. Model construction lives in the
// server-only sibling, providerModels.ts.

export const PROVIDER_IDS = ['anthropic', 'openai', 'google'] as const
export type ProviderId = (typeof PROVIDER_IDS)[number]

export function isProviderId(v: unknown): v is ProviderId {
  return typeof v === 'string' && (PROVIDER_IDS as readonly string[]).includes(v)
}

export interface ProviderInfo {
  id: ProviderId
  label: string
  /** Suggested model ids, most capable first. `[0]` is the provider's default. */
  suggestedModels: readonly string[]
  /** The API-key input's placeholder, so keys are recognisable at a glance. */
  keyHint: string
  /** Where the user goes to mint a key. */
  consoleUrl: string
}

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic',
    // The prompts in prompts.ts are tuned against claude-opus-5 — see the note there.
    suggestedModels: ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'],
    keyHint: 'sk-ant-…',
    consoleUrl: 'https://console.anthropic.com/settings/keys',
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    suggestedModels: ['gpt-5.1', 'gpt-5', 'gpt-5-mini'],
    keyHint: 'sk-…',
    consoleUrl: 'https://platform.openai.com/api-keys',
  },
  google: {
    id: 'google',
    label: 'Google',
    // Google's 3.x "pro" tiers are all still -preview at the pinned package version, so the
    // default is the newest stable flash; the preview pro is offered as an explicit choice.
    suggestedModels: ['gemini-3.7-flash', 'gemini-3.1-pro-preview', 'gemini-2.5-pro'],
    keyHint: 'AIza…',
    consoleUrl: 'https://aistudio.google.com/apikey',
  },
}

export const DEFAULT_PROVIDER: ProviderId = 'anthropic'

export function defaultModelFor(provider: ProviderId): string {
  return PROVIDERS[provider].suggestedModels[0]
}
