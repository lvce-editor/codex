import type { View } from '@lvce-editor/api'
import {
  createInstance,
  type ActiveCodexViewInstance,
} from '../CreateInstance/CreateInstance.ts'

export const viewId = 'codex.views.sessions'

export const view: View<ActiveCodexViewInstance> = {
  commands: {
    'codex.newSession': (instance) => {
      instance.newSession()
      return instance
    },
    'codex.openSession': async (instance, threadId?: string) => {
      if (threadId) {
        await instance.openSession(threadId)
      }
      return instance
    },
    'codex.refresh': async (instance) => {
      await instance.refresh()
      return instance
    },
    'codex.startSession': async (instance) => {
      await instance.startSession()
      return instance
    },
    'codex.stopSession': async (instance, threadId?: string) => {
      await instance.stopSession(threadId)
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

export { useMockData } from '../CreateInstance/CreateInstance.ts'
