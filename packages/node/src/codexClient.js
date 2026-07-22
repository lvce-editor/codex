import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const mockCodexPath = fileURLToPath(new URL('./mockCodex.js', import.meta.url))
const maximumErrorCharacters = 16_000
const requestTimeout = 15_000

const asObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Codex app-server returned an invalid response')
  }
  return value
}

const toError = (error, stderr = '') => {
  if (error instanceof Error) {
    const detail = stderr.trim()
    return detail ? new Error(`${error.message}: ${detail}`) : error
  }
  return new Error(String(error))
}

export class CodexAppServerClient {
  constructor(options = {}) {
    this.spawn = options.spawn || spawn
    this.executable = options.executable || 'codex'
    this.args = options.args || ['app-server']
    this.environment = options.environment || {}
    this.child = undefined
    this.connectPromise = undefined
    this.buffer = ''
    this.errorOutput = ''
    this.nextRequestId = 1
    this.pending = new Map()
    this.statuses = new Map()
  }

  configure({ executable = 'codex' } = {}) {
    this.stop()
    this.executable = executable
    this.args = ['app-server']
    this.environment = {}
  }

  useMockData(data = {}) {
    this.stop()
    this.executable = process.execPath
    this.args = [
      mockCodexPath,
      Buffer.from(JSON.stringify(data)).toString('base64url'),
    ]
    this.environment = { ELECTRON_RUN_AS_NODE: '1' }
  }

  appendError(chunk) {
    this.errorOutput = `${this.errorOutput}${chunk}`.slice(
      -maximumErrorCharacters,
    )
  }

  failPending(error) {
    const actualError = toError(error, this.errorOutput)
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout)
      pending.reject(actualError)
    }
    this.pending.clear()
  }

  handleNotification(message) {
    if (message.method === 'thread/status/changed') {
      const { status, threadId } = message.params || {}
      if (threadId && status) {
        this.statuses.set(threadId, status)
      }
      return
    }
    if (message.method === 'thread/started') {
      const thread = message.params?.thread
      if (thread?.id && thread.status) {
        this.statuses.set(thread.id, thread.status)
      }
      return
    }
    if (message.method === 'turn/started') {
      const threadId = message.params?.threadId
      if (threadId) {
        this.statuses.set(threadId, { activeFlags: [], type: 'active' })
      }
      return
    }
    if (message.method === 'turn/completed') {
      const threadId = message.params?.threadId
      if (threadId) {
        this.statuses.set(threadId, { type: 'idle' })
      }
    }
  }

  handleLine(line) {
    if (!line.trim()) {
      return
    }
    let message
    try {
      message = JSON.parse(line)
    } catch {
      return
    }
    if (!message || typeof message !== 'object') {
      return
    }
    if (!('id' in message)) {
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
      pending.reject(
        new Error(
          typeof message.error.message === 'string'
            ? message.error.message
            : JSON.stringify(message.error),
        ),
      )
      return
    }
    pending.resolve(message.result)
  }

  handleOutput(chunk) {
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

  send(message) {
    const child = this.child
    if (!child?.stdin.writable) {
      throw new Error('Codex app-server is not running')
    }
    child.stdin.write(`${JSON.stringify(message)}\n`)
  }

  sendRequest(method, params = {}) {
    const id = this.nextRequestId++
    const promise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`Codex app-server request timed out: ${method}`))
      }, requestTimeout)
      this.pending.set(id, { reject, resolve, timeout })
    })
    this.send({ id, method, params })
    return promise
  }

  sendNotification(method, params = {}) {
    this.send({ method, params })
  }

  async start() {
    this.buffer = ''
    this.errorOutput = ''
    const child = this.spawn(this.executable, this.args, {
      env: { ...process.env, ...this.environment },
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    this.child = child
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => this.handleOutput(chunk))
    child.stderr.on('data', (chunk) => this.appendError(chunk))
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

  async connect() {
    if (!this.connectPromise) {
      this.connectPromise = this.start()
    }
    try {
      await this.connectPromise
    } catch (error) {
      this.connectPromise = undefined
      this.stop()
      throw toError(error, this.errorOutput)
    }
  }

  async request(method, params = {}) {
    await this.connect()
    return this.sendRequest(method, params)
  }

  mergeStatus(thread) {
    const status = this.statuses.get(thread.id)
    return status ? { ...thread, status } : thread
  }

  async listSessions() {
    const threads = []
    let cursor = null
    do {
      const response = asObject(
        await this.request('thread/list', {
          cursor,
          limit: 100,
          sortDirection: 'desc',
          sortKey: 'updated_at',
        }),
      )
      const data = Array.isArray(response.data) ? response.data : []
      threads.push(...data.map((thread) => this.mergeStatus(thread)))
      cursor = typeof response.nextCursor === 'string' ? response.nextCursor : null
    } while (cursor)
    return threads
  }

  async readSession(threadId) {
    const response = asObject(
      await this.request('thread/read', { includeTurns: true, threadId }),
    )
    return this.mergeStatus(asObject(response.thread))
  }

  async startSession({ cwd, prompt }) {
    const startParams = cwd ? { cwd } : {}
    const response = asObject(await this.request('thread/start', startParams))
    const thread = asObject(response.thread)
    await this.request('turn/start', {
      input: [{ text: prompt, text_elements: [], type: 'text' }],
      threadId: thread.id,
    })
    this.statuses.set(thread.id, { activeFlags: [], type: 'active' })
    return this.mergeStatus(thread)
  }

  async stopSession(threadId) {
    const thread = await this.readSession(threadId)
    const turn = [...(thread.turns || [])]
      .reverse()
      .find((candidate) => candidate.status === 'inProgress')
    if (!turn) {
      return
    }
    await this.request('turn/interrupt', { threadId, turnId: turn.id })
    this.statuses.set(threadId, { type: 'idle' })
  }

  stop() {
    const child = this.child
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
  'Codex.configure': (options) => client.configure(options),
  'Codex.listSessions': () => client.listSessions(),
  'Codex.readSession': (threadId) => client.readSession(threadId),
  'Codex.startSession': (options) => client.startSession(options),
  'Codex.stopSession': (threadId) => client.stopSession(threadId),
  'Codex.test.useMockData': (data) => client.useMockData(data),
}
