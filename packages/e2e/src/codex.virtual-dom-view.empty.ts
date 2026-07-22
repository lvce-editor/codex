import type { Test } from '@lvce-editor/test-with-playwright'
import { useMockDataAndShowCodex } from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.empty'

export const test: Test = async ({ Command, expect, Locator, Main }) => {
  await Main.closeAllEditors()
  await useMockDataAndShowCodex(Command, [])

  await expect(Locator('text=No Codex sessions yet')).toBeVisible()
  await expect(Locator('button[name="newSession"]')).toBeVisible()
}
