import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import {
  createSession,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.turn-error'

export const test: Test = async ({ Command, expect, Locator }) => {
  const thread = {
    ...createSession(1),
    turns: [
      {
        completedAt: 1_700_000_004,
        error: { message: 'The command failed' },
        id: 'turn-failed',
        items: [],
        startedAt: 1_700_000_002,
        status: 'failed' as const,
      },
    ],
  }
  await useMockDataAndShowCodex(Command, [thread])
  await Command.executeExtensionCommand('codex.openSession', 'thread-1')

  const status = Locator('.CodexTurnStatus')
  const error = Locator('.CodexErrorMessage')
  await expect(status).toHaveText('failed')
  await expect(error).toHaveText('The command failed')
}
