import type { Test } from '@lvce-editor/test-with-playwright'
import {
  createSession,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.details'

export const test: Test = async ({ Command, expect, Locator }) => {
  const thread = {
    ...createSession(1),
    turns: [
      {
        completedAt: 1_700_000_004,
        error: null,
        id: 'turn-1',
        items: [
          {
            content: [{ text: 'Fix the flaky test', type: 'text' }],
            id: 'user-1',
            type: 'userMessage',
          },
          {
            id: 'agent-1',
            text: 'The flaky test is fixed.',
            type: 'agentMessage',
          },
        ],
        startedAt: 1_700_000_002,
        status: 'completed' as const,
      },
    ],
  }
  await useMockDataAndShowCodex(Command, [thread])

  const session = Locator('button[name="session:thread-1"]')
  // eslint-disable-next-line e2e/no-direct-click
  await session.click()

  await expect(Locator('text=Fix the flaky test')).toBeVisible()
  await expect(Locator('text=The flaky test is fixed.')).toBeVisible()
  await expect(Locator('button[name="back"]')).toBeVisible()
}
