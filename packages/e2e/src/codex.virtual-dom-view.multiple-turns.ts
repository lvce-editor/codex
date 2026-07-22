import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import {
  createSession,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.multiple-turns'

export const test: Test = async ({ Command, expect, Locator }) => {
  const thread = {
    ...createSession(1),
    turns: [
      {
        completedAt: 1_700_000_003,
        error: null,
        id: 'turn-1',
        items: [
          { id: 'agent-1', text: 'First response', type: 'agentMessage' },
        ],
        startedAt: 1_700_000_002,
        status: 'completed' as const,
      },
      {
        completedAt: 1_700_000_005,
        error: null,
        id: 'turn-2',
        items: [
          { id: 'agent-2', text: 'Second response', type: 'agentMessage' },
        ],
        startedAt: 1_700_000_004,
        status: 'completed' as const,
      },
    ],
  }
  await useMockDataAndShowCodex(Command, [thread])
  await Command.executeExtensionCommand('codex.openSession', 'thread-1')

  const turns = Locator('.CodexTurn')
  const transcriptItems = Locator('.CodexTranscriptText')
  const firstResponse = Locator('text=First response')
  const secondResponse = Locator('text=Second response')
  await expect(turns).toHaveCount(2)
  await expect(transcriptItems).toHaveCount(2)
  await expect(firstResponse).toBeVisible()
  await expect(secondResponse).toBeVisible()
}
