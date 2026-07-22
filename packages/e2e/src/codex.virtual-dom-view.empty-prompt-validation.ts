import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import { useMockDataAndShowCodex } from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.empty-prompt-validation'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, [])
  await Command.executeExtensionCommand('codex.newSession')
  await Command.executeExtensionCommand('codex.startSession')

  const error = Locator('.CodexErrorMessage')
  const prompt = Locator('textarea[name="prompt"]')
  await expect(error).toHaveText('Enter a task for Codex.')
  await expect(prompt).toBeVisible()
}
