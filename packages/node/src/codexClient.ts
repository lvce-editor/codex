/* eslint-disable unicorn/consistent-class-member-order */
import {
  spawn,
  type ChildProcessWithoutNullStreams,
  type SpawnOptionsWithoutStdio,
} from 'node:child_process'
import { fileURLToPath } from 'node:url'

type Spawn = (
  command: string,
  arguments_: readonly string[],
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
  options: Readonly<
    SpawnOptionsWithoutStdio & {
      readonly stdio: readonly ['pipe', 'pipe', 'pipe']
    }
  >,
) => ChildProcessWithoutNullStreams

interface PendingRequest {
  readonly reject: (error: Error) => void
  readonly resolve: (value: unknown) => void
  readonly timeout: ReturnType<typeof setTimeout>
}

interface AppServerError {
  readonly message?: unknown
}

interface AppServerMessage {
  readonly error?: AppServerError
  readonly id?: number
  readonly method?: string
  readonly params?: Readonly<Record<string, unknown>>
  readonly result?: unknown
}

interface ThreadStatus {
  readonly activeFlags?: readonly string[]
  readonly type: string
}

interface CodexTurn {
  readonly id: string
  readonly status: string
}

interface CodexThread {
  readonly id: string
  readonly [key: string]: unknown
  readonly status: ThreadStatus
  readonly turns?: readonly CodexTurn[]
}

interface ThreadListResponse {
  readonly data?: readonly CodexThread[]
}

interface ThreadReadResponse {
  readonly thread: CodexThread
}

interface ThreadStartResponse {
  readonly thread: CodexThread
}

interface ConfigureOptions {
  readonly executable?: string
}

interface MockCodexData {
  readonly [key: string]: unknown
}

interface StartSessionOptions {
  readonly cwd: string
  readonly prompt: string
}

interface CodexAppServerClientOptions {
  readonly args?: readonly string[]
  readonly environment?: Readonly<Record<string, string>>
  readonly executable?: string
  readonly spawn?: Spawn
}

const sourceIsTypeScript = import.meta.url.endsWith('.ts')
const mockCodexPath = fileURLToPath(
  new URL(
    sourceIsTypeScript ? './mockCodex.ts' : './mockCodex.js',
    import.meta.url,
  ),
)
const maximumErrorCharacters = 16_000
export const maximumSessionCount = 50
const requestTimeout = 15_000

const asRecord = (value: unknown): Readonly<Record<string, unknown>> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Codex app-server returned an invalid response')
  }
  return value as Readonly<Record<string, unknown>>
}

const asThread = (value: unknown): CodexThread => {
  const thread = asRecord(value)
  if (typeof thread.id !== 'string' || !thread.status) {
    throw new TypeError('Codex app-server returned an invalid thread')
  }
  return thread as unknown as CodexThread
}

const toError = (error: unknown, stderr = ''): Error => {
  const actualError = error instanceof Error ? error : new Error(String(error))
  const detail = stderr.trim()
  return detail ? new Error(`${actualError.message}: ${detail}`) : actualError
}

export class CodexAppServerClient {
  private readonly spawnProcess: Spawn
  private args: readonly string[]
  private buffer = ''
  private child: ChildProcessWithoutNullStreams | undefined
  private connectPromise: Promise<void> | undefined
  private environment: Readonly<Record<string, string>>
  private errorOutput = ''
  private executable: string
  private nextRequestId = 1
  private readonly pending = new Map<number, PendingRequest>()
  private readonly statuses = new Map<string, ThreadStatus>()

  constructor(options: Readonly<CodexAppServerClientOptions> = {}) {
    this.spawnProcess = options.spawn || spawn
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

  private appendError(chunk: string): void {
    this.errorOutput = `${this.errorOutput}${chunk}`.slice(
      -maximumErrorCharacters,
    )
  }

  private failPending(error: unknown): void {
    const actualError = toError(error, this.errorOutput)
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout)
      pending.reject(actualError)
    }
    this.pending.clear()
  }

  private handleNotification(message: Readonly<AppServerMessage>): void {
    if (message.method === 'thread/status/changed') {
      const status = message.params?.status as ThreadStatus | undefined
      const threadId = message.params?.threadId
      if (typeof threadId === 'string' && status) {
        this.statuses.set(threadId, status)
      }
      return
    }
    if (message.method === 'thread/started') {
      const threadValue = message.params?.thread
      if (threadValue) {
        const thread = asThread(threadValue)
        this.statuses.set(thread.id, thread.status)
      }
      return
    }
    const threadId = message.params?.threadId
    if (typeof threadId !== 'string') {
      return
    }
    if (message.method === 'turn/started') {
      this.statuses.set(threadId, { activeFlags: [], type: 'active' })
    } else if (message.method === 'turn/completed') {
      this.statuses.set(threadId, { type: 'idle' })
    }
  }

  private handleLine(line: string): void {
    if (!line.trim()) {
      return
    }
    let message: AppServerMessage
    try {
      message = JSON.parse(line) as AppServerMessage
    } catch {
      return
    }
    if (message.id === undefined) {
      this.handleNotification(message)
      return
    }
    const pending = this.pending.get(message.id)
    if (!pending) {
      return
    }
    clearTimeout(pending.timeout)
    this.pending.delete(message.id)
    if (message.error) {
      const detail =
        typeof message.error.message === 'string'
          ? message.error.message
          : JSON.stringify(message.error)
      pending.reject(new Error(detail))
      return
    }
    pending.resolve(message.result)
  }

  private handleOutput(chunk: string): void {
    this.buffer += chunk
    while (true) {
      const newline = this.buffer.indexOf('\n')
      if (newline === -1) {
        return
      }
      const line = this.buffer.slice(0, newline)
      this.buffer = this.buffer.slice(newline + 1)
      this.handleLine(line)
    }
  }

  private send(message: Readonly<AppServerMessage>): void {
    const { child } = this
    if (!child?.stdin.writable) {
      throw new Error('Codex app-server is not running')
    }
    child.stdin.write(`${JSON.stringify(message)}\n`)
  }

  private sendRequest<T>(method: string, params: unknown = {}): Promise<T> {
    const id = this.nextRequestId++
    const promise = new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`Codex app-server request timed out: ${method}`))
      }, requestTimeout)
      this.pending.set(id, { reject, resolve, timeout })
    })
    this.send({ id, method, params: asRecord(params) })
    return promise as Promise<T>
  }

  private sendNotification(method: string, params: unknown = {}): void {
    this.send({ method, params: asRecord(params) })
  }

  private async start(): Promise<void> {
    this.buffer = ''
    this.errorOutput = ''
    const child = this.spawnProcess(this.executable, this.args, {
      env: { ...process.env, ...this.environment },
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    this.child = child
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => this.handleOutput(chunk))
    child.stderr.on('data', (chunk: string) => this.appendError(chunk))
    child.on('error', (error) => this.failPending(error))
    child.on('exit', (code, signal) => {
      if (this.child === child) {
        this.child = undefined
        this.connectPromise = undefined
      }
      this.failPending(
        new Error(`Codex app-server exited (${signal ?? code ?? 'unknown'})`),
      )
    })
    await this.sendRequest('initialize', {
      capabilities: null,
      clientInfo: {
        name: 'lvce_editor',
        title: 'Lvce Editor Codex Extension',
        version: '0.1.0',
      },
    })
    this.sendNotification('initialized')
  }

  private async connect(): Promise<void> {
    this.connectPromise ||= this.start()
    try {
      await this.connectPromise
    } catch (error) {
      this.connectPromise = undefined
      this.stop()
      throw toError(error, this.errorOutput)
    }
  }

  private async request<T>(method: string, params: unknown = {}): Promise<T> {
    await this.connect()
    return this.sendRequest<T>(method, params)
  }

  private mergeStatus(thread: Readonly<CodexThread>): CodexThread {
    const status = this.statuses.get(thread.id)
    return status ? { ...thread, status } : thread
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
    return data.map((thread) => this.mergeStatus(thread))
  }

  async readSession(threadId: string): Promise<CodexThread> {
    const response = await this.request<ThreadReadResponse>('thread/read', {
      includeTurns: true,
      threadId,
    })
    return this.mergeStatus(asThread(response.thread))
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
    this.statuses.set(thread.id, { activeFlags: [], type: 'active' })
    return this.mergeStatus(thread)
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
    this.statuses.set(threadId, { type: 'idle' })
  }

  stop(): void {
    const { child } = this
    this.child = undefined
    this.connectPromise = undefined
    if (child && !child.killed) {
      child.kill()
    }
    this.failPending(new Error('Codex app-server stopped'))
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
