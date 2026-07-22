import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import {
  createSessions,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.empty-transcript'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, createSessions(1))
  await Command.executeExtensionCommand('codex.openSession', 'thread-1')

  const emptyText = Locator('.CodexEmptyText')
  const turns = Locator('.CodexTurn')
  await expect(emptyText).toHaveText('This session has no turns yet.')
  await expect(turns).toHaveCount(0)
}
