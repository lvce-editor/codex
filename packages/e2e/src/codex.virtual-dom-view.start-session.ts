import type { Test } from '@lvce-editor/test-with-playwright'
import { useMockDataAndShowCodex } from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.start-session'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, [])
  const newSession = Locator('button[name="newSession"]').first()
  // eslint-disable-next-line e2e/no-direct-click
  await newSession.click()

  const prompt = Locator('textarea[name="prompt"]')
  await prompt.type('Create a hello world page')
  // eslint-disable-next-line e2e/no-direct-click
  await Locator('button[name="startSession"]').click()

  await expect(Locator('text=Create a hello world page')).toBeVisible()
  await expect(Locator('.CodexStatus')).toHaveText('In progress')
}
