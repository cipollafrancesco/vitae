import 'server-only'
import {
  APICallError,
  generateText,
  NoObjectGeneratedError,
  NoOutputGeneratedError,
  Output,
  TypeValidationError,
} from 'ai'
import type { z } from 'zod'
import { API_KEY_HEADER, MODEL_HEADER, PROVIDER_HEADER } from './headers'
import { PROVIDER_RUNTIMES } from './providerModels'
import { isProviderId, PROVIDERS, type ProviderId } from './providers'

// Server-side only. Holds no key of its own: the user's key arrives on the request, is used
// for exactly one call, and is never persisted or logged. Nothing here writes the key, the
// resume, or the job description anywhere — that's a deliberate constraint, not an oversight,
// so keep it that way when adding logging.

/** A failure we already have a user-facing sentence for. */
export class AiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'AiRequestError'
  }
}

export interface AiCredentials {
  provider: ProviderId
  model: string
  apiKey: string
}

/** Pulls the provider/model/key triple off the request, or throws a 400 the UI can render. */
export function credentialsFromRequest(request: Request): AiCredentials {
  const provider = request.headers.get(PROVIDER_HEADER)
  const apiKey = request.headers.get(API_KEY_HEADER)?.trim()

  if (!isProviderId(provider)) {
    throw new AiRequestError(400, 'Pick an AI provider in AI settings.')
  }
  if (!apiKey) {
    throw new AiRequestError(400, `Add your ${PROVIDERS[provider].label} API key in AI settings.`)
  }

  const model = request.headers.get(MODEL_HEADER)?.trim() || PROVIDERS[provider].suggestedModels[0]
  return { provider, model, apiKey }
}

/**
 * Validates a request body, turning a schema failure into a 400 rather than letting it fall
 * through to the generic 500 handler.
 */
export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    throw new AiRequestError(400, 'Malformed request body.')
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw new AiRequestError(400, 'That request was missing something the model needs.')
  }
  return parsed.data
}

/**
 * One structured call. `Output.object` validates the response against `schema` before it gets
 * back here, so callers receive a value of the schema's type or an AiRequestError — never a
 * half-parsed object.
 */
export async function generateStructured<T>({
  credentials,
  schema,
  system,
  prompt,
}: {
  credentials: AiCredentials
  schema: z.ZodType<T>
  system: string
  prompt: string
}): Promise<T> {
  const info = PROVIDERS[credentials.provider]
  const runtime = PROVIDER_RUNTIMES[credentials.provider]

  try {
    const { output } = await generateText({
      model: runtime.createModel(credentials.apiKey, credentials.model),
      system,
      prompt,
      output: Output.object({ schema }),
      ...(runtime.providerOptions ? { providerOptions: runtime.providerOptions } : {}),
    })
    return output
  } catch (error) {
    throw toAiRequestError(error, info.label)
  }
}

/**
 * Maps SDK failures to sentences a user can act on, most specific first. Matches on the SDK's
 * typed error classes rather than message text, so a wording change upstream can't silently
 * turn a rate-limit into a generic failure.
 */
function toAiRequestError(error: unknown, providerLabel: string): AiRequestError {
  // The model answered, but not with something matching the schema. Usually a weaker model
  // rather than a broken request, so it's worth telling the user retrying may work.
  if (NoObjectGeneratedError.isInstance(error) || NoOutputGeneratedError.isInstance(error)) {
    return new AiRequestError(
      502,
      "The model didn't return usable suggestions. Try again, or switch to a more capable model in AI settings.",
    )
  }
  if (TypeValidationError.isInstance(error)) {
    return new AiRequestError(
      502,
      "The model's response didn't match the expected format. Try again, or switch models in AI settings.",
    )
  }

  if (APICallError.isInstance(error)) {
    const status = error.statusCode ?? 502
    if (status === 401 || status === 403) {
      return new AiRequestError(401, `${providerLabel} rejected that API key. Check it in AI settings.`)
    }
    if (status === 404) {
      return new AiRequestError(
        400,
        `${providerLabel} doesn't recognise that model id. Pick another in AI settings.`,
      )
    }
    if (status === 429) {
      return new AiRequestError(429, `${providerLabel} is rate limiting your key. Try again shortly.`)
    }
    if (error.isRetryable || status >= 500) {
      return new AiRequestError(502, `${providerLabel} is having trouble right now. Try again shortly.`)
    }
    // Not every provider signals a bad key with 401: Google returns 400 INVALID_ARGUMENT for
    // one. Since the request body is schema-validated before it leaves, a client error that
    // reaches here is almost always the key or the model id, so name both rather than shrug.
    if (status === 400) {
      return new AiRequestError(
        400,
        `${providerLabel} rejected the request — usually an invalid API key or model id. Check both in AI settings.`,
      )
    }
    return new AiRequestError(502, `${providerLabel} rejected the request.`)
  }

  return new AiRequestError(500, 'Something went wrong generating suggestions.')
}

/** Uniform JSON error body, so every route reports failures the same way. */
export function errorResponse(error: unknown): Response {
  const e = error instanceof AiRequestError ? error : toAiRequestError(error, 'The AI provider')
  return Response.json({ error: e.message }, { status: e.status })
}
