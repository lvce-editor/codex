import { createInterface } from 'node:readline'

const decodeData = (value) => {
  if (!value) {
    return {}
  }
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString())
  } catch {
    return {}
  }
}

const data = decodeData(process.argv[2])
const threads = [...(Array.isArray(data.threads) ? data.threads : [])]
const pageSize = Math.max(1, Number(data.pageSize) || 100)
let nextThread = threads.length + 1
let nextTurn = 1

const send = (message) => {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

const sendResult = (id, result) => send({ id, result })

const sendError = (id, message) =>
  send({ error: { code: -32_000, message }, id })

const getThread = (threadId) => threads.find((thread) => thread.id === threadId)

const copyForList = (thread) => ({ ...thread, turns: [] })

const handleRequest = (message) => {
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
      backwardsCursor: page.length ? String(start) : null,
      data: page.map(copyForList),
      nextCursor: next < threads.length ? String(next) : null,
    })
    return
  }
  if (method === 'thread/read') {
    const thread = getThread(params.threadId)
    if (!thread) {
      sendError(id, `Unknown thread: ${params.threadId}`)
      return
    }
    sendResult(id, { thread })
    return
  }
  if (method === 'thread/start') {
    const now = Math.floor(Date.now() / 1000)
    const thread = {
      cliVersion: 'mock-1.0.0',
      createdAt: now,
      cwd: params.cwd || '/workspace',
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
      sendError(id, `Unknown thread: ${params.threadId}`)
      return
    }
    const now = Math.floor(Date.now() / 1000)
    const text = params.input?.find((item) => item.type === 'text')?.text || ''
    const turn = {
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
    const turn = thread?.turns.find((candidate) => candidate.id === params.turnId)
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
  sendError(id, `Unsupported mock method: ${method}`)
}

const lines = createInterface({ input: process.stdin })
lines.on('line', (line) => {
  try {
    handleRequest(JSON.parse(line))
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.stack : error}\n`)
  }
})
