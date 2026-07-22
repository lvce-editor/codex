import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import {
  createSessions,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.one-hundred-sessions'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, createSessions(100), 7)

  const sessions = Locator('.CodexSession')
  const first = Locator('button[name="session:thread-1"]')
  const last = Locator('button[name="session:thread-100"]')
  await expect(sessions).toHaveCount(100)
  await expect(first).toBeVisible()
  await expect(last).toHaveCount(1)
}
