import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import { useMockDataAndShowCodex } from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.start-session-trims-prompt'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, [])
  await Command.executeExtensionCommand('codex.newSession')
  await Locator('textarea[name="prompt"]').type('  Trim this task  ')
  await Command.executeExtensionCommand('codex.startSession')

  const transcript = Locator('.CodexTranscriptText')
  const status = Locator('.CodexStatus')
  await expect(transcript).toHaveText('Trim this task')
  await expect(status).toHaveText('In progress')
}
