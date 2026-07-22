import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import {
  createSessions,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.show-returns-to-list'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, createSessions(1))
  await Command.executeExtensionCommand('codex.openSession', 'thread-1')

  const back = Locator('button[name="back"]')
  await expect(back).toBeVisible()
  await useMockDataAndShowCodex(Command, createSessions(1))

  const session = Locator('button[name="session:thread-1"]')
  await expect(session).toBeVisible()
  await expect(back).toHaveCount(0)
}
