import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import {
  createSessions,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.refresh-detail'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, createSessions(1))
  await Command.executeExtensionCommand('codex.openSession', 'thread-1')
  await Command.executeExtensionCommand('codex.refresh')

  const back = Locator('button[name="back"]')
  const id = Locator('.CodexDetailId')
  const loading = Locator('.CodexLoading')
  await expect(back).toBeVisible()
  await expect(id).toHaveText('thread-1')
  await expect(loading).toHaveCount(0)
}
