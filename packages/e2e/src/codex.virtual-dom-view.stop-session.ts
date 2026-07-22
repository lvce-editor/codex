import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import {
  activeStatus,
  createSessions,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.stop-session'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, createSessions(1, activeStatus))

  const stop = Locator('button[name="stop:thread-1"]')
  // eslint-disable-next-line e2e/no-direct-click
  await stop.click()

  const status = Locator('[name="status:thread-1"]')
  const remainingStop = Locator('button[name="stop:thread-1"]')
  await expect(status).toHaveText('Finished')
  await expect(remainingStop).toHaveCount(0)
}
