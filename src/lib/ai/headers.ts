// Shared by the server routes and the browser hook, so it must stay free of any server-only
// import — that's the whole reason these three constants don't live in client.ts.

export const PROVIDER_HEADER = 'x-ai-provider'
export const MODEL_HEADER = 'x-ai-model'
export const API_KEY_HEADER = 'x-ai-api-key'
