import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import type {
  AppServerMessage,
  CodexAppServerClientOptions,
  SpawnProcess,
} from '../AppServerTypes/AppServerTypes.ts'
import { asRecord, toError } from '../AppServerProtocol/AppServerProtocol.ts'
import { JsonLineDecoder } from '../JsonLineDecoder/JsonLineDecoder.ts'

interface AppServerConnectionOptions extends CodexAppServerClientOptions {
  readonly onNotification: (message: Readonly<AppServerMessage>) => void
}

interface PendingRequest {
  readonly reject: (error: Error) => void
  readonly resolve: (value: unknown) => void
  readonly timeout: ReturnType<typeof setTimeout>
}

const maximumErrorCharacters = 16_000
const requestTimeout = 15_000

export class AppServerConnection {
  private readonly args: readonly string[]
  private child: ChildProcessWithoutNullStreams | undefined
  private connectPromise: Promise<void> | undefined
  private readonly decoder = new JsonLineDecoder()
  private readonly environment: Readonly<Record<string, string>>
  private errorOutput = ''
  private readonly executable: string
  private nextRequestId = 1
  private readonly onNotification: (message: Readonly<AppServerMessage>) => void
  private readonly pending = new Map<number, PendingRequest>()
  private readonly spawnProcess: SpawnProcess

  constructor(options: Readonly<AppServerConnectionOptions>) {
    this.spawnProcess = options.spawn || spawn
    this.executable = options.executable || 'codex'
    this.args = options.args || ['app-server']
    this.environment = options.environment || {}
    this.onNotification = options.onNotification
  }

  private appendError(chunk: string): void {
    this.errorOutput = `${this.errorOutput}${chunk}`.slice(
      -maximumErrorCharacters,
    )
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

  private failPending(error: unknown): void {
    const actualError = toError(error, this.errorOutput)
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout)
      pending.reject(actualError)
    }
    this.pending.clear()
  }

  private handleMessage(message: Readonly<AppServerMessage>): void {
    if (message.id === undefined) {
      this.onNotification(message)
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
    for (const message of this.decoder.push(chunk)) {
      this.handleMessage(message)
    }
  }

  private send(message: Readonly<AppServerMessage>): void {
    const { child } = this
    if (!child?.stdin.writable) {
      throw new Error('Codex app-server is not running')
    }
    child.stdin.write(`${JSON.stringify(message)}\n`)
  }

  private sendNotification(method: string, params: unknown = {}): void {
    this.send({ method, params: asRecord(params) })
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

  private async start(): Promise<void> {
    this.decoder.reset()
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

  async request<T>(method: string, params: unknown = {}): Promise<T> {
    await this.connect()
    return this.sendRequest<T>(method, params)
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
