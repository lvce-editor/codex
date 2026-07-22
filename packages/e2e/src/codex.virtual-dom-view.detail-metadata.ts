import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import {
  createSessions,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.detail-metadata'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, createSessions(1))
  await Command.executeExtensionCommand('codex.openSession', 'thread-1')

  const cwd = Locator('.CodexDetailCwd')
  const id = Locator('.CodexDetailId')
  const status = Locator('.CodexStatus')
  await expect(cwd).toHaveText('/workspace/project-1')
  await expect(id).toHaveText('thread-1')
  await expect(status).toHaveText('Finished')
}
