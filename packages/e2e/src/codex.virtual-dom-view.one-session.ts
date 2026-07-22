import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import {
  createSessions,
  useMockDataAndShowCodex,
} from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.one-session'

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, createSessions(1))

  const sessions = Locator('.CodexSession')
  const title = Locator('text=Session 1')
  const cwd = Locator('text=/workspace/project-1')
  const quickComposer = Locator('.CodexQuickComposer')
  const toolbarActions = Locator('.CodexIconButton')
  await expect(sessions).toHaveCount(1)
  await expect(title).toBeVisible()
  await expect(cwd).toHaveCount(1)
  await expect(toolbarActions).toHaveCount(2)
  await expect(quickComposer).toBeVisible()
  await expect(quickComposer).toHaveText('Do anything+New session↑')
}
