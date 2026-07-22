import type { Test } from '@lvce-editor/test-with-playwright'
import {
  createSessions,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.finished'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, createSessions(1))

  await expect(Locator('[name="status:thread-1"]')).toHaveText('Finished')
  await expect(Locator('button[name="stop:thread-1"]')).toHaveCount(0)
}
