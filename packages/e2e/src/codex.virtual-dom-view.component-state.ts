import type { Test } from '@lvce-editor/test-with-playwright'
// eslint-disable-next-line e2e/no-imports
import { useMockDataAndShowCodex } from './_codex.virtual-dom-view.shared.ts'

export const name = 'codex.virtual-dom-view.component-state'

interface ComponentInfo {
  readonly editable: boolean
  readonly moduleId: string
  readonly uid: number
}

export const test: Test = async ({ Command, expect, Locator }) => {
  await useMockDataAndShowCodex(Command, [])
  await Command.executeExtensionCommand('codex.newSession')
  const prompt = Locator('textarea[name="prompt"]')
  await expect(prompt).toBeVisible()
  const components = (await Command.execute(
    'ComponentState.getComponents',
  )) as readonly ComponentInfo[]
  const component = components.find((item) => item.moduleId === 'ExtensionView')
  if (!component?.editable) {
    throw new Error('Expected editable extension component state')
  }
  const state = await Command.execute('ComponentState.getState', component.uid)
  if (state.mode !== 'new') {
    throw new Error('Expected live new-session state')
  }
  await Command.execute('ComponentState.setState', component.uid, {
    ...state,
    prompt: 'Edited in component state',
  })
  await expect(prompt).toHaveValue('Edited in component state')
  await Command.executeExtensionCommand('codex.refresh')
  const updatedState = await Command.execute(
    'ComponentState.getState',
    component.uid,
  )
  if (updatedState.prompt !== 'Edited in component state') {
    throw new Error('Component edit was lost after refresh')
  }
}
