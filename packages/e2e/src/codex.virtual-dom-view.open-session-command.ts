import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import {
  createSessions,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.open-session-command'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, createSessions(1))

  const session = Locator('button[name="session:thread-1"]')
  await Command.executeExtensionCommand('codex.openSession', 'thread-1')

  const title = Locator('.CodexTitle')
  const back = Locator('button[name="back"]')
  await expect(title).toHaveText('Session 1')
  await expect(back).toBeVisible()
  await expect(session).toHaveCount(0)
}
