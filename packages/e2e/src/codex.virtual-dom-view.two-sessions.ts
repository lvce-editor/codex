import type { Test } from '@lvce-editor/test-with-playwright'
import {
  createSessions,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.two-sessions'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, createSessions(2))

  await expect(Locator('.CodexSession')).toHaveCount(2)
  await expect(Locator('button[name="session:thread-1"]')).toBeVisible()
  await expect(Locator('button[name="session:thread-2"]')).toBeVisible()
}
