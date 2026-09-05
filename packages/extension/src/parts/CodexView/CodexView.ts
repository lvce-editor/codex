import type { InstanceView } from '@lvce-editor/api'
import type { CodexViewState } from '../Render/Render.ts'
import {
  createInstance,
  type ActiveCodexViewInstance,
} from '../CreateInstance/CreateInstance.ts'

export const viewId = 'codex.views.sessions'

export const view: InstanceView<
  ActiveCodexViewInstance,
  Readonly<CodexViewState>
> = {
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
  getComponentState: (instance) => instance.getComponentState(),
  icon: 'sparkle',
  id: viewId,
  kind: 'virtualDom',
  setComponentState: (instance, state) => instance.setComponentState(state),
  title: 'Codex',
}

export { useMockData } from '../CreateInstance/CreateInstance.ts'
