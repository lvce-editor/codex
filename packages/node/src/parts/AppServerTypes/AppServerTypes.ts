import type {
  ChildProcessWithoutNullStreams,
  SpawnOptionsWithoutStdio,
} from 'node:child_process'

export interface AppServerError {
  readonly message?: unknown
}

export interface AppServerMessage {
  readonly error?: AppServerError
  readonly id?: number
  readonly method?: string
  readonly params?: Readonly<Record<string, unknown>>
  readonly result?: unknown
}

export interface CodexAppServerClientOptions {
  readonly args?: readonly string[]
  readonly environment?: Readonly<Record<string, string>>
  readonly executable?: string
  readonly spawn?: SpawnProcess
}

export interface CodexThread {
  readonly id: string
  readonly [key: string]: unknown
  readonly status: ThreadStatus
  readonly turns?: readonly CodexTurn[]
}

export interface CodexTurn {
  readonly id: string
  readonly status: string
}

export interface ConfigureOptions {
  readonly executable?: string
}

export interface MockCodexData {
  readonly [key: string]: unknown
}

export type SpawnProcess = (
  command: string,
  arguments_: readonly string[],
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
  options: Readonly<
    SpawnOptionsWithoutStdio & {
      readonly stdio: readonly ['pipe', 'pipe', 'pipe']
    }
  >,
) => ChildProcessWithoutNullStreams

export interface StartSessionOptions {
  readonly cwd: string
  readonly prompt: string
}

export interface ThreadListResponse {
  readonly data?: readonly CodexThread[]
}

export interface ThreadReadResponse {
  readonly thread: CodexThread
}

export interface ThreadStartResponse {
  readonly thread: CodexThread
}

export interface ThreadStatus {
  readonly activeFlags?: readonly string[]
  readonly type: string
}
