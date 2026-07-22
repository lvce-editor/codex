import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import {
  createSession,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.system-error-status'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, [
    createSession(1, { type: 'systemError' }),
  ])

  const status = Locator('.CodexStatusError')
  const stop = Locator('button[name="stop:thread-1"]')
  await expect(status).toHaveText('Error')
  await expect(stop).toHaveCount(0)
}
