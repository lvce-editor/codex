import type { Test } from '@lvce-editor/test-with-playwright'
import {
  createSessions,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.one-hundred-sessions'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, createSessions(100), 7)

  await expect(Locator('.CodexSession')).toHaveCount(100)
  await expect(Locator('button[name="session:thread-1"]')).toBeVisible()
  await expect(Locator('button[name="session:thread-100"]')).toHaveCount(1)
}
