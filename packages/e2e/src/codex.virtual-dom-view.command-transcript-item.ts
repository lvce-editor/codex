import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import {
  createSession,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.command-transcript-item'

export const test: Test = async ({ Command, expect, Locator }) => {
  const thread = {
    ...createSession(1),
    turns: [
      {
        completedAt: 1_700_000_004,
        error: null,
        id: 'turn-command',
        items: [
          {
            command: 'npm test',
            id: 'command-1',
            status: 'completed',
            type: 'commandExecution',
          },
        ],
        startedAt: 1_700_000_002,
        status: 'completed' as const,
      },
    ],
  }
  await useMockDataAndShowCodex(Command, [thread])
  await Command.executeExtensionCommand('codex.openSession', 'thread-1')

  const label = Locator('.CodexTranscriptLabel')
  const text = Locator('.CodexTranscriptText')
  await expect(label).toHaveText('Command')
  await expect(text).toHaveText('npm test')
}
