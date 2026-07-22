/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types */
import type { MockThread, MockTurn } from './mockCodexTypes.ts'

interface MockThreadPage {
  readonly backwardsCursor: string | null
  readonly data: readonly MockThread[]
  readonly nextCursor: string | null
}

interface MockTurnResult {
  readonly thread: MockThread
  readonly turn: MockTurn
}

const copyForList = (thread: Readonly<MockThread>): MockThread => ({
  ...thread,
  turns: [],
})

export class MockThreadStore {
  private readonly counters
  private readonly threads: MockThread[]

  constructor(threads: readonly MockThread[] = []) {
    this.threads = threads.map((thread) => structuredClone(thread))
    this.counters = {
      thread: this.threads.length + 1,
      turn: 1,
    }
  }

  interrupt(threadId: unknown, turnId: unknown): MockTurnResult | undefined {
    const thread = this.read(threadId)
    const turn = thread?.turns.find((candidate) => candidate.id === turnId)
    if (!thread || !turn) {
      return undefined
    }
    turn.status = 'interrupted'
    turn.completedAt = Math.floor(Date.now() / 1000)
    thread.status = { type: 'idle' }
    thread.updatedAt = turn.completedAt
    return { thread, turn }
  }

  list(
    cursor: unknown,
    limit: unknown,
    pageSize: number,
    sortDirection: unknown,
  ): MockThreadPage {
    const start = Number(cursor) || 0
    const actualLimit = Math.min(Number(limit) || pageSize, pageSize)
    const sortedThreads =
      sortDirection === 'desc'
        ? this.threads.toSorted((a, b) => b.updatedAt - a.updatedAt)
        : this.threads
    const page = sortedThreads.slice(start, start + actualLimit)
    const next = start + page.length
    return {
      backwardsCursor: page.length > 0 ? String(start) : null,
      data: page.map(copyForList),
      nextCursor: next < sortedThreads.length ? String(next) : null,
    }
  }

  read(threadId: unknown): MockThread | undefined {
    return this.threads.find((thread) => thread.id === threadId)
  }

  start(cwd: unknown): MockThread {
    const now = Math.floor(Date.now() / 1000)
    const thread: MockThread = {
      cliVersion: 'mock-1.0.0',
      createdAt: now,
      cwd: typeof cwd === 'string' ? cwd : '/workspace',
      id: `thread-new-${this.counters.thread++}`,
      name: null,
      preview: 'New Codex session',
      status: { type: 'idle' },
      turns: [],
      updatedAt: now,
    }
    this.threads.unshift(thread)
    return thread
  }

  startTurn(threadId: unknown, input: unknown): MockTurnResult | undefined {
    const thread = this.read(threadId)
    if (!thread) {
      return undefined
    }
    const now = Math.floor(Date.now() / 1000)
    const inputs = Array.isArray(input) ? input : []
    const textInput = inputs.find(
      (item): item is { readonly text: string; readonly type: 'text' } =>
        Boolean(
          item &&
          typeof item === 'object' &&
          'type' in item &&
          item.type === 'text' &&
          'text' in item &&
          typeof item.text === 'string',
        ),
    )
    const text = textInput?.text || ''
    const turn: MockTurn = {
      completedAt: null,
      error: null,
      id: `turn-new-${this.counters.turn++}`,
      items: [
        {
          clientId: null,
          content: [{ text, text_elements: [], type: 'text' }],
          id: `item-user-${this.counters.turn}`,
          type: 'userMessage',
        },
      ],
      startedAt: now,
      status: 'inProgress',
    }
    thread.preview = text
    thread.status = { activeFlags: [], type: 'active' }
    thread.turns.push(turn)
    thread.updatedAt = now
    return { thread, turn }
  }
}
