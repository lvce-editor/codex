import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import {
  setPrompt,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.start-session-trims-prompt'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, [])
  await Command.executeExtensionCommand('codex.newSession')
  const prompt = Locator('textarea[name="prompt"]')
  await expect(prompt).toBeVisible()
  await setPrompt(Command, '  Trim this task  ')
  await Command.executeExtensionCommand('codex.startSession')

  const transcript = Locator('.CodexTranscriptText')
  const status = Locator('.CodexStatus')
  await expect(transcript).toHaveText('Trim this task')
  await expect(status).toHaveText('In progress')
}
