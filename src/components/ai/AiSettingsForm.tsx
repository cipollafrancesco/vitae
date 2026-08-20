'use client'

import { useId, useState } from 'react'
import { clearAiSettings, saveAiSettings, type AiSettings } from '@/lib/ai/settings'
import { useAiSettings } from '@/lib/ai/useAiSettings'
import { defaultModelFor, isProviderId, PROVIDER_IDS, PROVIDERS } from '@/lib/ai/providers'
import { inputCls, labelCls } from '@/components/editor/fieldStyles'

const CUSTOM_MODEL = '__custom__'

/**
 * Provider, model, and key. Settings come from the shared external store rather than local
 * state, so writing here is immediately visible to every other panel that reads them.
 */
export function AiSettingsForm() {
  const settings = useAiSettings()
  const [customModel, setCustomModel] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const providerId = useId()
  const modelId = useId()
  const keyId = useId()

  const info = PROVIDERS[settings.provider]
  const usingCustomModel = !info.suggestedModels.includes(settings.model)

  const commit = (next: AiSettings) => {
    setSaveFailed(!saveAiSettings(next))
  }

  const handleProviderChange = (value: string) => {
    if (!isProviderId(value)) return
    // Model ids don't carry across vendors, so switching provider resets to that provider's
    // default rather than leaving an id the new provider will 404 on.
    setCustomModel('')
    commit({ ...settings, provider: value, model: defaultModelFor(value) })
  }

  const handleModelChange = (value: string) => {
    if (value === CUSTOM_MODEL) {
      commit({ ...settings, model: customModel.trim() || defaultModelFor(settings.provider) })
      return
    }
    commit({ ...settings, model: value })
  }

  const handleClear = () => {
    clearAiSettings()
    setCustomModel('')
    setRevealed(false)
    setSaveFailed(false)
  }

  return (
    <div className="flex flex-col gap-3 p-1">
      <p className="text-xs text-gray-500">
        AI features run on your own API key. It stays in this browser and is sent only with the
        request it authenticates — never stored on a server.
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor={providerId} className={labelCls}>
          Provider
        </label>
        <select
          id={providerId}
          value={settings.provider}
          onChange={(e) => handleProviderChange(e.target.value)}
          className={inputCls}
        >
          {PROVIDER_IDS.map((id) => (
            <option key={id} value={id}>
              {PROVIDERS[id].label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={modelId} className={labelCls}>
          Model
        </label>
        <select
          id={modelId}
          value={usingCustomModel ? CUSTOM_MODEL : settings.model}
          onChange={(e) => handleModelChange(e.target.value)}
          className={inputCls}
        >
          {info.suggestedModels.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
          <option value={CUSTOM_MODEL}>Custom…</option>
        </select>
        {usingCustomModel && (
          <input
            type="text"
            value={customModel}
            placeholder="model id"
            aria-label="Custom model id"
            onChange={(e) => setCustomModel(e.target.value)}
            onBlur={() => {
              const trimmed = customModel.trim()
              if (trimmed) commit({ ...settings, model: trimmed })
            }}
            className={`${inputCls} mt-1 font-mono text-xs`}
          />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={keyId} className={labelCls}>
          {info.label} API key
        </label>
        <div className="flex gap-1.5">
          <input
            id={keyId}
            type={revealed ? 'text' : 'password'}
            value={settings.apiKey}
            placeholder={info.keyHint}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => commit({ ...settings, apiKey: e.target.value })}
            className={`${inputCls} font-mono text-xs`}
          />
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="shrink-0 px-2 rounded border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
            aria-pressed={revealed}
          >
            {revealed ? 'Hide' : 'Show'}
          </button>
        </div>
        <a
          href={info.consoleUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="text-xs text-brand hover:text-brand-600 w-fit"
        >
          Get a {info.label} key ↗
        </a>
      </div>

      {saveFailed && (
        <p className="text-xs text-red-600">
          Couldn&apos;t save these settings — browser storage may be full or blocked.
        </p>
      )}

      <button
        type="button"
        onClick={handleClear}
        className="text-xs text-gray-500 hover:text-red-600 w-fit transition-colors duration-150"
      >
        Clear key and settings
      </button>
    </div>
  )
}
