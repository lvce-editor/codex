import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import {
  createSession,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.untitled-title-fallback'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, [
    { ...createSession(1), name: null, preview: '' },
  ])

  const sessionTitle = Locator('.CodexSessionTitle')
  await expect(sessionTitle).toHaveText('Untitled session')
  await Command.executeExtensionCommand('codex.openSession', 'thread-1')
  const detailTitle = Locator('.CodexTitle')
  await expect(detailTitle).toHaveText('Untitled session')
}
