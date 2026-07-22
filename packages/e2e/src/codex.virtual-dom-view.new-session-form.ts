import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import { useMockDataAndShowCodex } from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.new-session-form'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, [])
  await Command.executeExtensionCommand('codex.newSession')

  const title = Locator('.CodexTitle')
  const cwd = Locator('input[name="cwd"]')
  const prompt = Locator('textarea[name="prompt"]')
  const start = Locator('button[name="startSession"]')
  const cancel = Locator('button[name="cancelNewSession"]')
  await expect(title).toHaveText('New Codex session')
  await expect(cwd).toBeVisible()
  await expect(prompt).toBeVisible()
  await expect(start).toBeVisible()
  await expect(cancel).toBeVisible()
}
