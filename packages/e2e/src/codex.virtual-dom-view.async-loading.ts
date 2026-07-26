import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import {
  createSessions,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.async-loading'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, createSessions(1), {
    listDelayMs: 200,
    waitForData: false,
  })

  const loading = Locator('.CodexLoading')
  const spinner = Locator('.CodexSpinner')
  const session = Locator('button[name="session:thread-1"]')
  await expect(loading).toBeVisible()
  await expect(spinner).toBeVisible()
  let lastError: unknown
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      await expect(session).toBeVisible()
      lastError = undefined
      break
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }
  if (lastError) {
    throw lastError instanceof Error
      ? lastError
      : new Error('session did not become visible')
  }
  await expect(loading).toHaveCount(0)
}
