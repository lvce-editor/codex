import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import { useMockDataAndShowCodex } from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.show-cancels-new-session'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, [])
  await Command.executeExtensionCommand('codex.newSession')

  const cancel = Locator('button[name="cancelNewSession"]')
  await expect(cancel).toBeVisible()
  await useMockDataAndShowCodex(Command, [])

  const emptyTitle = Locator('text=No Codex sessions yet')
  const prompt = Locator('textarea[name="prompt"]')
  await expect(emptyTitle).toBeVisible()
  await expect(prompt).toHaveCount(0)
}
