import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import { useMockDataAndShowCodex } from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.start-session'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, [])
  const emptyTitle = Locator('text=No Codex sessions yet')
  await expect(emptyTitle).toBeVisible()
  await Command.executeExtensionCommand('codex.newSession')

  const prompt = Locator('textarea[name="prompt"]')
  await prompt.type('Create a hello world page')
  await Command.executeExtensionCommand('codex.startSession')

  const message = Locator('.CodexTranscriptText')
  const status = Locator('.CodexStatus')
  await expect(message).toBeVisible()
  await expect(status).toHaveText('In progress')
}
