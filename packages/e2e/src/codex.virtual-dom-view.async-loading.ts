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
  await new Promise((resolve) => setTimeout(resolve, 500))
  await expect(session).toBeVisible()
  await expect(loading).toHaveCount(0)
}
