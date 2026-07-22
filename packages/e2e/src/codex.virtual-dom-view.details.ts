import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
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
  await expect(session).toBeVisible()
  await Command.executeExtensionCommand('codex.openSession', 'thread-1')

  const prompt = Locator('text=Fix the flaky test')
  const response = Locator('text=The flaky test is fixed.')
  const back = Locator('button[name="back"]')
  const transcriptItems = Locator('.CodexTranscriptText')
  await expect(back).toBeVisible()
  await expect(transcriptItems).toHaveCount(2)
  await expect(prompt).toBeVisible()
  await expect(response).toBeVisible()
}
