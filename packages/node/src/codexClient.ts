/* eslint-disable unicorn/consistent-class-member-order */
import { fileURLToPath } from 'node:url'
import type {
  CodexAppServerClientOptions,
  CodexThread,
  ConfigureOptions,
  MockCodexData,
  SpawnProcess,
  StartSessionOptions,
  ThreadListResponse,
  ThreadReadResponse,
  ThreadStartResponse,
} from './parts/AppServerTypes/AppServerTypes.ts'
import { AppServerConnection } from './parts/AppServerConnection/AppServerConnection.ts'
import { asThread } from './parts/AppServerProtocol/AppServerProtocol.ts'
import { ThreadStatuses } from './parts/ThreadStatuses/ThreadStatuses.ts'

const sourceIsTypeScript = import.meta.url.endsWith('.ts')
const mockCodexPath = fileURLToPath(
  new URL(
    sourceIsTypeScript ? './mockCodex.ts' : './mockCodex.js',
    import.meta.url,
  ),
)

export const maximumSessionCount = 50

export class CodexAppServerClient {
  private args: readonly string[]
  private connection: AppServerConnection | undefined
  private environment: Readonly<Record<string, string>>
  private executable: string
  private readonly spawnProcess: SpawnProcess | undefined
  private readonly statuses = new ThreadStatuses()

  constructor(options: Readonly<CodexAppServerClientOptions> = {}) {
    this.spawnProcess = options.spawn
    this.executable = options.executable || 'codex'
    this.args = options.args || ['app-server']
    this.environment = options.environment || {}
  }

  configure({ executable = 'codex' }: Readonly<ConfigureOptions> = {}): void {
    this.stop()
    this.statuses.clear()
    this.executable = executable
    this.args = ['app-server']
    this.environment = {}
  }

  private createConnection(): AppServerConnection {
    return new AppServerConnection({
      args: this.args,
      environment: this.environment,
      executable: this.executable,
      onNotification: (message) => this.statuses.handleNotification(message),
      ...(this.spawnProcess && { spawn: this.spawnProcess }),
    })
  }

  private async request<T>(method: string, params: unknown = {}): Promise<T> {
    this.connection ||= this.createConnection()
    return this.connection.request<T>(method, params)
  }

  async listSessions(): Promise<readonly CodexThread[]> {
    const response = await this.request<ThreadListResponse>('thread/list', {
      cursor: null,
      limit: maximumSessionCount,
      sortDirection: 'desc',
      sortKey: 'updated_at',
    })
    const data: readonly CodexThread[] = Array.isArray(response.data)
      ? response.data
      : []
    return data.map((thread) => this.statuses.merge(thread))
  }

  async readSession(threadId: string): Promise<CodexThread> {
    const response = await this.request<ThreadReadResponse>('thread/read', {
      includeTurns: true,
      threadId,
    })
    return this.statuses.merge(asThread(response.thread))
  }

  async startSession(
    options: Readonly<StartSessionOptions>,
  ): Promise<CodexThread> {
    const startParams = options.cwd ? { cwd: options.cwd } : {}
    const response = await this.request<ThreadStartResponse>(
      'thread/start',
      startParams,
    )
    const thread = asThread(response.thread)
    await this.request('turn/start', {
      input: [
        { text: options.prompt, text_elements: [], type: 'text' as const },
      ],
      threadId: thread.id,
    })
    this.statuses.setActive(thread.id)
    return this.statuses.merge(thread)
  }

  async stopSession(threadId: string): Promise<void> {
    const thread = await this.readSession(threadId)
    const turn = (thread.turns || []).findLast(
      (candidate) => candidate.status === 'inProgress',
    )
    if (!turn) {
      return
    }
    await this.request('turn/interrupt', { threadId, turnId: turn.id })
    this.statuses.setIdle(threadId)
  }

  stop(): void {
    this.connection?.stop()
    this.connection = undefined
  }

  useMockData(data: Readonly<MockCodexData> = {}): void {
    this.stop()
    this.statuses.clear()
    this.executable = process.execPath
    this.args = [
      mockCodexPath,
      Buffer.from(JSON.stringify(data)).toString('base64url'),
    ]
    this.environment = { ELECTRON_RUN_AS_NODE: '1' }
  }
}

const client = new CodexAppServerClient()

export const commandMap = {
  'Codex.configure': (options: Readonly<ConfigureOptions>): void =>
    client.configure(options),
  'Codex.listSessions': (): Promise<readonly CodexThread[]> =>
    client.listSessions(),
  'Codex.readSession': (threadId: string): Promise<CodexThread> =>
    client.readSession(threadId),
  'Codex.startSession': (
    options: Readonly<StartSessionOptions>,
  ): Promise<CodexThread> => client.startSession(options),
  'Codex.stopSession': (threadId: string): Promise<void> =>
    client.stopSession(threadId),
  'Codex.test.useMockData': (data: Readonly<MockCodexData>): void =>
    client.useMockData(data),
}
