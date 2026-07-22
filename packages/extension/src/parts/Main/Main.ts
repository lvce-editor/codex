import {
  activate as activateExtensionApi,
  executeCommand,
  registerCommand,
  registerView,
} from '@lvce-editor/api'
import type { MockCodexData } from '../CodexTypes/CodexTypes.ts'
import * as CodexView from '../CodexView/CodexView.ts'

const state = { isActivated: false }

export const activate = async (): Promise<void> => {
  if (state.isActivated) {
    return
  }
  state.isActivated = true
  await activateExtensionApi()
  registerView(CodexView.view)
  registerCommand({
    execute: async (data?: Readonly<MockCodexData>) => {
      if (data) {
        await CodexView.useMockData(data)
      }
      return executeCommand('SideBar.show', CodexView.viewId, true)
    },
    id: 'codex.show',
  })
}

export const deactivate = (): void => {}
