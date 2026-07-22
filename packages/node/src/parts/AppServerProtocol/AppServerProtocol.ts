import type { CodexThread } from '../AppServerTypes/AppServerTypes.ts'

export const asRecord = (value: unknown): Readonly<Record<string, unknown>> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Codex app-server returned an invalid response')
  }
  return value as Readonly<Record<string, unknown>>
}

export const asThread = (value: unknown): CodexThread => {
  const thread = asRecord(value)
  if (typeof thread.id !== 'string' || !thread.status) {
    throw new TypeError('Codex app-server returned an invalid thread')
  }
  return thread as unknown as CodexThread
}

export const toError = (error: unknown, stderr = ''): Error => {
  const actualError = error instanceof Error ? error : new Error(String(error))
  const detail = stderr.trim()
  return detail ? new Error(`${actualError.message}: ${detail}`) : actualError
}
