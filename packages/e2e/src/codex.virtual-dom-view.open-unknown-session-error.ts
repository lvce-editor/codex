import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import { useMockDataAndShowCodex } from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.open-unknown-session-error'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, [])
  await Command.executeExtensionCommand('codex.openSession', 'missing-thread')

  const error = Locator('.CodexErrorMessage')
  const emptyTitle = Locator('text=No Codex sessions yet')
  await expect(error).toHaveText('Unknown thread: missing-thread')
  await expect(emptyTitle).toBeVisible()
}
