import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import {
  createSessions,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.limits-one-hundred-sessions'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, createSessions(100))

  const sessions = Locator('.CodexSession')
  const newest = Locator('button[name="session:thread-100"]')
  const oldestVisible = Locator('button[name="session:thread-51"]')
  const olderSession = Locator('button[name="session:thread-50"]')
  await expect(sessions).toHaveCount(50)
  await expect(newest).toBeVisible()
  await expect(oldestVisible).toHaveCount(1)
  await expect(olderSession).toHaveCount(0)
}
