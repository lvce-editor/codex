import type { VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import {
  getPreference,
  getWorkspaceFolder,
  type ViewContext,
  type ViewEvent,
  type VirtualDomViewInstance,
} from '@lvce-editor/api'
import type { MockCodexData } from '../CodexTypes/CodexTypes.ts'
import {
  createCodexClient,
  type CodexClient,
} from '../CodexClient/CodexClient.ts'
import { render, type CodexViewState } from '../Render/Render.ts'

export interface ActiveCodexViewInstance extends VirtualDomViewInstance {
  readonly newSession: () => void
  readonly openSession: (threadId: string) => Promise<void>
  readonly refresh: () => Promise<void>
  readonly reload: () => Promise<void>
  readonly startSession: () => Promise<void>
  readonly stopSession: (threadId?: string) => Promise<void>
  readonly useMockData: (data: Readonly<MockCodexData>) => Promise<void>
}

type ClientFactory = () => Promise<CodexClient>

const dependencyState: { factory: ClientFactory } = {
  factory: (): Promise<CodexClient> => createCodexClient(),
}

const activeInstances = new Set<ActiveCodexViewInstance>()

export const useMockData = async (
  data: Readonly<MockCodexData>,
): Promise<void> => {
  dependencyState.factory = (): Promise<CodexClient> =>
    createCodexClient({ mockData: data })
  await Promise.all(
    Array.from(activeInstances, (instance) => instance.useMockData(data)),
  )
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const getRefreshInterval = async (): Promise<number> => {
  const value = await getPreference('codex.refreshInterval')
  return typeof value === 'number' && value >= 250 ? value : 1000
}

export const createInstance = async (
  context?: ViewContext,
): Promise<ActiveCodexViewInstance> => {
  const state: CodexViewState = {
    cwd: '',
    error: '',
    loading: true,
    mode: 'list',
    prompt: '',
    selectedSession: undefined,
    sessions: [],
    starting: false,
    stoppingThreadId: '',
  }
  let clientPromise = dependencyState.factory()
  let disposed = false
  let loadPromise: Promise<void> | undefined
  let pollTimer: ReturnType<typeof setInterval> | undefined

  const getClient = (): Promise<CodexClient> => clientPromise

  const requestRerender = (): void => {
    if (!context?.requestRerender || disposed) {
      return
    }
    globalThis.setTimeout(() => void context.requestRerender(), 0)
  }

  const loadSessions = async (showLoading: boolean): Promise<void> => {
    if (disposed) {
      return
    }
    if (loadPromise) {
      await loadPromise
      return
    }
    if (showLoading) {
      state.loading = true
      requestRerender()
    }
    const currentLoad = (async (): Promise<void> => {
      try {
        const client = await getClient()
        state.sessions = await client.listSessions()
        state.error = ''
        if (state.selectedSession) {
          const updated = state.sessions.find(
            (thread) => thread.id === state.selectedSession?.id,
          )
          if (updated) {
            state.selectedSession = {
              ...state.selectedSession,
              ...updated,
              turns: state.selectedSession.turns,
            }
          }
        }
      } catch (error) {
        state.error = getErrorMessage(error)
      } finally {
        state.loading = false
        requestRerender()
      }
    })()
    loadPromise = currentLoad
    await currentLoad
    if (loadPromise === currentLoad) {
      loadPromise = undefined
    }
  }

  const loadWorkspace = async (): Promise<void> => {
    try {
      state.cwd = await getWorkspaceFolder()
    } catch {
      state.cwd = ''
    }
  }

  const startPolling = async (): Promise<void> => {
    const interval = await getRefreshInterval()
    pollTimer = globalThis.setInterval(() => void loadSessions(false), interval)
  }

  const disposeClient = async (): Promise<void> => {
    try {
      const client = await getClient()
      await client.dispose()
    } catch {
      // Initialization errors are already displayed by loadSessions.
    }
  }

  const instance: ActiveCodexViewInstance = {
    async dispose(): Promise<void> {
      disposed = true
      activeInstances.delete(instance)
      if (pollTimer) {
        clearInterval(pollTimer)
      }
      await disposeClient()
    },
    getContext(): Readonly<Record<string, boolean>> {
      return {
        'codex.sessionDetailFocus': state.mode === 'detail',
        'codex.sessionsFocus': state.mode === 'list',
      }
    },
    async handleEvent(event: Readonly<ViewEvent>): Promise<void> {
      activeInstances.delete(instance)
      activeInstances.add(instance)
      const name = event.name || ''
      if (event.type === 'input') {
        const value = typeof event.value === 'string' ? event.value : ''
        if (name === 'prompt') {
          state.prompt = value
        } else if (name === 'cwd') {
          state.cwd = value
        }
        return
      }
      if (event.type !== 'click') {
        return
      }
      switch (name) {
        case 'back':
        case 'cancelNewSession': {
          state.mode = 'list'
          state.error = ''
          requestRerender()
          return
        }
        case 'newSession': {
          instance.newSession()
          return
        }
        case 'refresh': {
          await instance.refresh()
          return
        }
        case 'startSession': {
          await instance.startSession()
          return
        }
      }
      if (name.startsWith('session:')) {
        await instance.openSession(name.slice('session:'.length))
      } else if (name.startsWith('stop:')) {
        await instance.stopSession(name.slice('stop:'.length))
      }
    },
    newSession(): void {
      state.mode = 'new'
      state.error = ''
      state.prompt = ''
      requestRerender()
    },
    async openSession(threadId: string): Promise<void> {
      state.loading = true
      requestRerender()
      try {
        const client = await getClient()
        state.selectedSession = await client.readSession(threadId)
        state.mode = 'detail'
        state.error = ''
      } catch (error) {
        state.error = getErrorMessage(error)
      } finally {
        state.loading = false
        requestRerender()
      }
    },
    async refresh(): Promise<void> {
      await loadSessions(true)
      if (state.mode === 'detail' && state.selectedSession) {
        try {
          const client = await getClient()
          state.selectedSession = await client.readSession(
            state.selectedSession.id,
          )
        } catch (error) {
          state.error = getErrorMessage(error)
        }
        requestRerender()
      }
    },
    async reload(): Promise<void> {
      await disposeClient()
      clientPromise = dependencyState.factory()
      state.mode = 'list'
      state.selectedSession = undefined
      await loadSessions(true)
    },
    render(): readonly VirtualDomNode[] {
      return render(state)
    },
    async startSession(): Promise<void> {
      const prompt = state.prompt.trim()
      if (!prompt) {
        state.error = 'Enter a task for Codex.'
        requestRerender()
        return
      }
      state.starting = true
      state.error = ''
      requestRerender()
      try {
        const client = await getClient()
        const thread = await client.startSession({ cwd: state.cwd, prompt })
        state.selectedSession = await client.readSession(thread.id)
        state.mode = 'detail'
        state.prompt = ''
        await loadSessions(false)
      } catch (error) {
        state.error = getErrorMessage(error)
      } finally {
        state.starting = false
        requestRerender()
      }
    },
    async stopSession(threadId?: string): Promise<void> {
      const id = threadId || state.selectedSession?.id
      if (!id || state.stoppingThreadId) {
        return
      }
      state.stoppingThreadId = id
      state.error = ''
      requestRerender()
      try {
        const client = await getClient()
        await client.stopSession(id)
        await loadSessions(false)
        if (state.selectedSession?.id === id) {
          state.selectedSession = await client.readSession(id)
        }
      } catch (error) {
        state.error = getErrorMessage(error)
      } finally {
        state.stoppingThreadId = ''
        requestRerender()
      }
    },
    async useMockData(data: Readonly<MockCodexData>): Promise<void> {
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = undefined
      }
      await loadPromise
      const client = await getClient()
      await client.useMockData(data)
      state.mode = 'list'
      state.selectedSession = undefined
      await loadSessions(true)
    },
  }

  activeInstances.add(instance)
  void (async (): Promise<void> => {
    await Promise.all([loadWorkspace(), loadSessions(false)])
    if (!disposed) {
      await startPolling()
    }
  })()
  return instance
}
