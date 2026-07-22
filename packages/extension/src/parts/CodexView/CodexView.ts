import type { View } from '@lvce-editor/api'
import {
  createInstance,
  type ActiveCodexViewInstance,
} from './CreateInstance.ts'

export const viewId = 'codex.views.sessions'

export const view: View<ActiveCodexViewInstance> = {
  commands: {
    'codex.newSession': (instance) => {
      instance.newSession()
      return instance
    },
    'codex.refresh': async (instance) => {
      await instance.refresh()
      return instance
    },
  },
  create: createInstance,
  displayName: 'Codex',
  icon: 'sparkle',
  id: viewId,
  kind: 'virtualDom',
  title: 'Codex',
}

export {
  newSessionActiveInstance,
  refreshActiveInstance,
  startSessionActiveInstance,
  stopSessionActiveInstance,
  useMockData,
} from './CreateInstance.ts'
