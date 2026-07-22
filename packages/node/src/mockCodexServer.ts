/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types */
import { createInterface } from 'node:readline'
import type { IncomingMessage, MockData } from './mockCodexTypes.ts'
import { MockThreadStore } from './mockThreadStore.ts'

export class MockCodexServer {
  private readonly listDelayMs: number
  private readonly pageSize: number
  private readonly store: MockThreadStore

  constructor(data: Readonly<MockData>) {
    this.store = new MockThreadStore(
      Array.isArray(data.threads) ? data.threads : [],
    )
    this.pageSize = Math.max(1, Number(data.pageSize) || 100)
    this.listDelayMs = Math.max(0, Number(data.listDelayMs) || 0)
  }

  private handleRequest(message: Readonly<IncomingMessage>): void {
    const { id, method, params = {} } = message
    if (id === undefined) {
      return
    }
    if (method === 'initialize') {
      this.sendResult(id, {
        codexHome: '/tmp/mock-codex-home',
        platformFamily: 'unix',
        platformOs: 'linux',
        userAgent: 'mock-codex/1.0.0',
      })
      return
    }
    if (method === 'thread/list') {
      const result = this.store.list(
        params.cursor,
        params.limit,
        this.pageSize,
        params.sortDirection,
      )
      globalThis.setTimeout(() => this.sendResult(id, result), this.listDelayMs)
      return
    }
    if (method === 'thread/read') {
      const thread = this.store.read(params.threadId)
      if (!thread) {
        this.sendError(id, `Unknown thread: ${String(params.threadId)}`)
        return
      }
      this.sendResult(id, { thread })
      return
    }
    if (method === 'thread/start') {
      const thread = this.store.start(params.cwd)
      this.sendResult(id, {
        approvalPolicy: 'on-request',
        cwd: thread.cwd,
        model: 'mock-codex',
        modelProvider: 'mock',
        serviceTier: null,
        thread,
      })
      this.send({ method: 'thread/started', params: { thread } })
      return
    }
    if (method === 'turn/start') {
      const result = this.store.startTurn(params.threadId, params.input)
      if (!result) {
        this.sendError(id, `Unknown thread: ${String(params.threadId)}`)
        return
      }
      const { thread, turn } = result
      this.sendResult(id, { turn })
      this.send({
        method: 'turn/started',
        params: { threadId: thread.id, turn },
      })
      this.send({
        method: 'thread/status/changed',
        params: { status: thread.status, threadId: thread.id },
      })
      return
    }
    if (method === 'turn/interrupt') {
      const result = this.store.interrupt(params.threadId, params.turnId)
      if (!result) {
        this.sendError(id, 'Turn not found')
        return
      }
      const { thread, turn } = result
      this.sendResult(id, {})
      this.send({
        method: 'turn/completed',
        params: { threadId: thread.id, turn },
      })
      this.send({
        method: 'thread/status/changed',
        params: { status: thread.status, threadId: thread.id },
      })
      return
    }
    this.sendError(id, `Unsupported mock method: ${String(method)}`)
  }

  private send(message: unknown): void {
    process.stdout.write(`${JSON.stringify(message)}\n`)
  }

  private sendError(id: number, message: string): void {
    this.send({ error: { code: -32_000, message }, id })
  }

  private sendResult(id: number, result: unknown): void {
    this.send({ id, result })
  }

  start(): void {
    const lines = createInterface({ input: process.stdin })
    lines.on('line', (line) => {
      try {
        this.handleRequest(JSON.parse(line) as IncomingMessage)
      } catch (error) {
        process.stderr.write(
          `${error instanceof Error ? error.stack : error}\n`,
        )
      }
    })
  }
}
