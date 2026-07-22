import type { Test } from '@lvce-editor/test-with-playwright'
import {
  createSession,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.waiting'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, [
    createSession(1, {
      activeFlags: ['waitingOnApproval'],
      type: 'active',
    }),
    createSession(2, {
      activeFlags: ['waitingOnUserInput'],
      type: 'active',
    }),
  ])

  await expect(Locator('[name="status:thread-1"]')).toHaveText(
    'Waiting for approval',
  )
  await expect(Locator('[name="status:thread-2"]')).toHaveText(
    'Waiting for input',
  )
}
