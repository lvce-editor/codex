import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import {
  createSessions,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.finished'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, createSessions(1))

  const status = Locator('.CodexStatus')
  const stop = Locator('button[name="stop:thread-1"]')
  await expect(status).toHaveText('Finished')
  await expect(stop).toHaveCount(0)
}
