import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import {
  createSession,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.plan-transcript-item'

export const test: Test = async ({ Command, expect, Locator }) => {
  const thread = {
    ...createSession(1),
    turns: [
      {
        completedAt: 1_700_000_004,
        error: null,
        id: 'turn-plan',
        items: [{ id: 'plan-1', text: 'Inspect, edit, verify', type: 'plan' }],
        startedAt: 1_700_000_002,
        status: 'completed' as const,
      },
    ],
  }
  await useMockDataAndShowCodex(Command, [thread])
  await Command.executeExtensionCommand('codex.openSession', 'thread-1')

  const label = Locator('.CodexTranscriptLabel')
  const text = Locator('.CodexTranscriptText')
  await expect(label).toHaveText('Plan')
  await expect(text).toHaveText('Inspect, edit, verify')
}
