import type { Test } from '@lvce-editor/test-with-playwright'
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

  await expect(Locator('[name="status:thread-1"]')).toHaveText('Finished')
  await expect(Locator('button[name="stop:thread-1"]')).toHaveCount(0)
}
