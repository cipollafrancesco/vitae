import { DEFAULT_PROVIDER, defaultModelFor, isProviderId, type ProviderId } from './providers'

// AI settings live in localStorage and are exposed as an external store (see useAiSettings.ts),
// so components read them through useSyncExternalStore rather than an effect. That keeps SSR
// and the first client render in agreement, and means a key pasted in the settings form is
// observed everywhere at once — no manual refresh plumbing between panels.
//
// Accessors mirror the idiom in ../storage.ts: SSR-safe, swallowing a failing localStorage
// (private mode, full quota) and returning a sentinel rather than throwing.

const SETTINGS_KEY = 'cv-editor-ai-settings'
const CONSENT_KEY = 'cv-editor-ai-consent'

export interface AiSettings {
  provider: ProviderId
  model: string
  apiKey: string
}

export function defaultSettings(): AiSettings {
  return { provider: DEFAULT_PROVIDER, model: defaultModelFor(DEFAULT_PROVIDER), apiKey: '' }
}

const DEFAULTS = defaultSettings()

function parseSettings(raw: string | null): AiSettings {
  if (!raw) return DEFAULTS
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return DEFAULTS
    const { provider, model, apiKey } = parsed as Record<string, unknown>
    const resolved: ProviderId = isProviderId(provider) ? provider : DEFAULT_PROVIDER
    return {
      provider: resolved,
      model: typeof model === 'string' && model.trim() ? model : defaultModelFor(resolved),
      apiKey: typeof apiKey === 'string' ? apiKey : '',
    }
  } catch {
    return DEFAULTS
  }
}

// ============================================================
// External store
// ============================================================

const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

/** Subscribes to changes from this tab (via emit) and from other tabs (via `storage`). */
export function subscribeAiStorage(onChange: () => void): () => void {
  listeners.add(onChange)
  window.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

// useSyncExternalStore compares snapshots by identity and re-renders in a loop if a new object
// comes back every call, so the parsed value is cached against the raw string it came from.
let cachedRaw: string | null = null
let cachedSettings: AiSettings = DEFAULTS

export function aiSettingsSnapshot(): AiSettings {
  if (typeof window === 'undefined') return DEFAULTS
  let raw: string | null = null
  try {
    raw = localStorage.getItem(SETTINGS_KEY)
  } catch {
    return DEFAULTS
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedSettings = parseSettings(raw)
  }
  return cachedSettings
}

export function aiSettingsServerSnapshot(): AiSettings {
  return DEFAULTS
}

/** Whether the user has been told what leaves the browser. Gated on before the first call. */
export function aiConsentSnapshot(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(CONSENT_KEY) === '1'
  } catch {
    return false
  }
}

export function aiConsentServerSnapshot(): boolean {
  return false
}

// ============================================================
// Mutations
// ============================================================

export function saveAiSettings(settings: AiSettings): boolean {
  if (typeof window === 'undefined') return true
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    emit()
    return true
  } catch {
    return false
  }
}

export function clearAiSettings(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(SETTINGS_KEY)
  } finally {
    emit()
  }
}

export function saveAiConsent(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CONSENT_KEY, '1')
  } catch {
    // A browser that won't remember the consent just asks again next time — harmless.
  } finally {
    emit()
  }
}

/** Non-reactive read, for the request path where a hook isn't available. */
export function loadAiSettings(): AiSettings {
  return aiSettingsSnapshot()
}

export function hasKey(settings: AiSettings): boolean {
  return settings.apiKey.trim().length > 0
}
