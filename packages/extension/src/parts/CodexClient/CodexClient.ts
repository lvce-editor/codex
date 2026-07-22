import { createNodeRpc, getPreference } from '@lvce-editor/api'
import type {
  CodexThread,
  MockCodexData,
  StartSessionOptions,
} from '../CodexTypes/CodexTypes.ts'

export interface CodexClient {
  readonly dispose: () => Promise<void>
  readonly listSessions: () => Promise<readonly CodexThread[]>
  readonly readSession: (threadId: string) => Promise<CodexThread>
  readonly startSession: (
    options: Readonly<StartSessionOptions>,
  ) => Promise<CodexThread>
  readonly stopSession: (threadId: string) => Promise<void>
  readonly useMockData: (data: Readonly<MockCodexData>) => Promise<void>
}

interface NodeRpc {
  readonly dispose: () => Promise<void>
  readonly invoke: (
    method: string,
    ...params: readonly unknown[]
  ) => Promise<any>
}

export interface CreateCodexClientOptions {
  readonly createRpc?: () => Promise<NodeRpc>
  readonly executable?: string
  readonly mockData?: Readonly<MockCodexData>
}

const createDefaultRpc = (): Promise<NodeRpc> => {
  return createNodeRpc({ id: 'builtin.codex.app-server' })
}

const getExecutable = async (explicit?: string): Promise<string> => {
  if (explicit) {
    return explicit
  }
  const preference = await getPreference('codex.path')
  return typeof preference === 'string' && preference ? preference : 'codex'
}

export const createCodexClient = async (
  options: Readonly<CreateCodexClientOptions> = {},
): Promise<CodexClient> => {
  const rpc = await (options.createRpc || createDefaultRpc)()
  if (options.mockData) {
    await rpc.invoke('Codex.test.useMockData', options.mockData)
  } else {
    await rpc.invoke('Codex.configure', {
      executable: await getExecutable(options.executable),
    })
  }
  return {
    dispose: () => rpc.dispose(),
    listSessions: () => rpc.invoke('Codex.listSessions'),
    readSession: (threadId) => rpc.invoke('Codex.readSession', threadId),
    startSession: (startOptions) =>
      rpc.invoke('Codex.startSession', startOptions),
    stopSession: async (threadId): Promise<void> => {
      await rpc.invoke('Codex.stopSession', threadId)
    },
    useMockData: async (data): Promise<void> => {
      await rpc.invoke('Codex.test.useMockData', data)
    },
  }
}
