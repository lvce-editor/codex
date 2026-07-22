import { createInterface } from 'node:readline'

interface MockStatus {
  readonly activeFlags?: readonly string[]
  readonly type: string
}

interface MockItem {
  readonly [key: string]: unknown
}

interface MockTurn {
  completedAt: number | null
  readonly error: null
  readonly id: string
  readonly items: readonly MockItem[]
  readonly startedAt: number
  status: string
}

interface MockThread {
  readonly cliVersion: string
  readonly createdAt: number
  readonly cwd: string
  readonly id: string
  readonly name: string | null
  preview: string
  status: MockStatus
  readonly turns: MockTurn[]
  updatedAt: number
}

interface MockData {
  readonly pageSize?: number
  readonly threads?: readonly MockThread[]
}

interface IncomingMessage {
  readonly id?: number
  readonly method?: string
  readonly params?: Readonly<Record<string, unknown>>
}

const decodeData = (value: string | undefined): MockData => {
  if (!value) {
    return {}
  }
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString()) as MockData
  } catch {
    return {}
  }
}

const data = decodeData(process.argv[2])
const threads: MockThread[] = structuredClone(
  Array.isArray(data.threads) ? data.threads : [],
)
const pageSize = Math.max(1, Number(data.pageSize) || 100)
let nextThread = threads.length + 1
let nextTurn = 1

const send = (message: unknown): void => {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

const sendResult = (id: number, result: unknown): void => send({ id, result })

const sendError = (id: number, message: string): void =>
  send({ error: { code: -32_000, message }, id })

const getThread = (threadId: unknown): MockThread | undefined =>
  threads.find((thread) => thread.id === threadId)

const copyForList = (thread: Readonly<MockThread>): MockThread => ({
  ...thread,
  turns: [],
})

const handleRequest = (message: Readonly<IncomingMessage>): void => {
  const { id, method, params = {} } = message
  if (id === undefined) {
    return
  }
  if (method === 'initialize') {
    sendResult(id, {
      codexHome: '/tmp/mock-codex-home',
      platformFamily: 'unix',
      platformOs: 'linux',
      userAgent: 'mock-codex/1.0.0',
    })
    return
  }
  if (method === 'thread/list') {
    const start = Number(params.cursor) || 0
    const limit = Math.min(Number(params.limit) || pageSize, pageSize)
    const page = threads.slice(start, start + limit)
    const next = start + page.length
    sendResult(id, {
      backwardsCursor: page.length > 0 ? String(start) : null,
      data: page.map(copyForList),
      nextCursor: next < threads.length ? String(next) : null,
    })
    return
  }
  if (method === 'thread/read') {
    const thread = getThread(params.threadId)
    if (!thread) {
      sendError(id, `Unknown thread: ${String(params.threadId)}`)
      return
    }
    sendResult(id, { thread })
    return
  }
  if (method === 'thread/start') {
    const now = Math.floor(Date.now() / 1000)
    const thread: MockThread = {
      cliVersion: 'mock-1.0.0',
      createdAt: now,
      cwd: typeof params.cwd === 'string' ? params.cwd : '/workspace',
      id: `thread-new-${nextThread++}`,
      name: null,
      preview: 'New Codex session',
      status: { type: 'idle' },
      turns: [],
      updatedAt: now,
    }
    threads.unshift(thread)
    sendResult(id, {
      approvalPolicy: 'on-request',
      cwd: thread.cwd,
      model: 'mock-codex',
      modelProvider: 'mock',
      serviceTier: null,
      thread,
    })
    send({ method: 'thread/started', params: { thread } })
    return
  }
  if (method === 'turn/start') {
    const thread = getThread(params.threadId)
    if (!thread) {
      sendError(id, `Unknown thread: ${String(params.threadId)}`)
      return
    }
    const now = Math.floor(Date.now() / 1000)
    const inputs = Array.isArray(params.input) ? params.input : []
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
      id: `turn-new-${nextTurn++}`,
      items: [
        {
          clientId: null,
          content: [{ text, text_elements: [], type: 'text' }],
          id: `item-user-${nextTurn}`,
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
    sendResult(id, { turn })
    send({ method: 'turn/started', params: { threadId: thread.id, turn } })
    send({
      method: 'thread/status/changed',
      params: { status: thread.status, threadId: thread.id },
    })
    return
  }
  if (method === 'turn/interrupt') {
    const thread = getThread(params.threadId)
    const turn = thread?.turns.find(
      (candidate) => candidate.id === params.turnId,
    )
    if (!thread || !turn) {
      sendError(id, 'Turn not found')
      return
    }
    turn.status = 'interrupted'
    turn.completedAt = Math.floor(Date.now() / 1000)
    thread.status = { type: 'idle' }
    thread.updatedAt = turn.completedAt
    sendResult(id, {})
    send({ method: 'turn/completed', params: { threadId: thread.id, turn } })
    send({
      method: 'thread/status/changed',
      params: { status: thread.status, threadId: thread.id },
    })
    return
  }
  sendError(id, `Unsupported mock method: ${String(method)}`)
}

const lines = createInterface({ input: process.stdin })
lines.on('line', (line) => {
  try {
    handleRequest(JSON.parse(line) as IncomingMessage)
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.stack : error}\n`)
  }
})
