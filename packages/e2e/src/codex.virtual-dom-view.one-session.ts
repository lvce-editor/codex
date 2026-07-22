import type { Test } from '@lvce-editor/test-with-playwright'
import {
  createSessions,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.one-session'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, createSessions(1))

  await expect(Locator('.CodexSession')).toHaveCount(1)
  await expect(Locator('text=Session 1')).toBeVisible()
  await expect(Locator('text=/workspace/project-1')).toBeVisible()
}
