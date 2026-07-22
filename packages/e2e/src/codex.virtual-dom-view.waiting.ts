import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
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

  const approval = Locator('[name="status:thread-1"]')
  const userInput = Locator('[name="status:thread-2"]')
  await expect(approval).toHaveText('Waiting for approval')
  await expect(userInput).toHaveText('Waiting for input')
}
