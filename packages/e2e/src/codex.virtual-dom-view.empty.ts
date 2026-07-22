import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import { useMockDataAndShowCodex } from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.empty'

export const test: Test = async ({ Command, expect, Locator, Main }) => {
  await Main.closeAllEditors()
  await useMockDataAndShowCodex(Command, [])

  const emptyTitle = Locator('text=No Codex sessions yet')
  const newSession = Locator('button[name="newSession"]')
  await expect(emptyTitle).toBeVisible()
  await expect(newSession).toBeVisible()
}
