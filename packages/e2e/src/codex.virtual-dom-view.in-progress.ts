import type { Test } from '@lvce-editor/test-with-playwright'
import {
  activeStatus,
  createSessions,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.in-progress'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, createSessions(1, activeStatus))

  await expect(Locator('[name="status:thread-1"]')).toHaveText('In progress')
  await expect(Locator('button[name="stop:thread-1"]')).toBeVisible()
}
