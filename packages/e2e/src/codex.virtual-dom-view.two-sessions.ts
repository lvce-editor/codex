import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import {
  createSessions,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.two-sessions'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, createSessions(2))

  const sessions = Locator('.CodexSession')
  const first = Locator('button[name="session:thread-1"]')
  const second = Locator('button[name="session:thread-2"]')
  await expect(sessions).toHaveCount(2)
  await expect(first).toBeVisible()
  await expect(second).toBeVisible()
}
