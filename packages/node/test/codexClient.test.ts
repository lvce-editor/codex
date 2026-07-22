import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  CodexAppServerClient,
  maximumSessionCount,
} from '../src/codexClient.ts'

interface TestThread {
  cliVersion: string
  createdAt: number
  cwd: string
  id: string
  name: string
  preview: string
  status: Readonly<Record<string, unknown>>
  turns: TestTurn[]
  updatedAt: number
}

interface TestTurn {
  completedAt: number | null
  error: null
  id: string
  items: Record<string, unknown>[]
  startedAt: number
  status: string
}

const clients = new Set<CodexAppServerClient>()
const finishedStatus: Readonly<Record<string, unknown>> = { type: 'idle' }

afterEach(() => {
  for (const client of clients) {
    client.stop()
  }
  clients.clear()
})

const createThread = (
  number: number,
  status: Readonly<Record<string, unknown>> = finishedStatus,
): TestThread => ({
  cliVersion: 'mock-1.0.0',
  createdAt: 1_700_000_000 + number,
  cwd: `/workspace/project-${number}`,
  id: `thread-${number}`,
  name: `Session ${number}`,
  preview: `Task ${number}`,
  status,
  turns: [],
  updatedAt: 1_700_000_000 + number,
})

const createClient = (
  data: Readonly<Record<string, unknown>>,
): CodexAppServerClient => {
  const client = new CodexAppServerClient()
  client.useMockData(data)
  clients.add(client)
  return client
}

void test('lists one Codex session', async () => {
  const client = createClient({ threads: [createThread(1)] })
  const sessions = await client.listSessions()
  assert.equal(sessions.length, 1)
  assert.equal(sessions[0]?.id, 'thread-1')
  assert.deepEqual(sessions[0]?.status, { type: 'idle' })
})

void test('lists only the latest 50 Codex sessions', async () => {
  const threads = Array.from({ length: 100 }, (_, index) =>
    createThread(index + 1),
  )
  const client = createClient({ threads })
  const sessions = await client.listSessions()
  assert.equal(sessions.length, maximumSessionCount)
  assert.equal(sessions[0]?.id, 'thread-100')
  assert.equal(sessions.at(-1)?.id, 'thread-51')
})

void test('reads session turns and transcript items', async () => {
  const thread = createThread(1)
  thread.turns = [
    {
      completedAt: 1_700_000_002,
      error: null,
      id: 'turn-1',
      items: [
        {
          content: [{ text: 'Fix the tests', type: 'text' }],
          id: 'item-1',
          type: 'userMessage',
        },
        { id: 'item-2', text: 'Tests fixed.', type: 'agentMessage' },
      ],
      startedAt: 1_700_000_001,
      status: 'completed',
    },
  ]
  const client = createClient({ threads: [thread] })
  const result = await client.readSession('thread-1')
  assert.equal(result.turns?.length, 1)
  assert.deepEqual(result.turns?.[0], thread.turns[0])
})

void test('starts and interrupts a session', async () => {
  const client = createClient({ threads: [] })
  const started = await client.startSession({
    cwd: '/workspace/new-project',
    prompt: 'Create a readme',
  })
  const active = await client.readSession(started.id)
  assert.equal(active.cwd, '/workspace/new-project')
  assert.deepEqual(active.status, { activeFlags: [], type: 'active' })
  assert.equal(active.turns?.[0]?.status, 'inProgress')

  await client.stopSession(started.id)
  const stopped = await client.readSession(started.id)
  assert.deepEqual(stopped.status, { type: 'idle' })
  assert.equal(stopped.turns?.[0]?.status, 'interrupted')
})

void test('reports app-server request errors', async () => {
  const client = createClient({ threads: [] })
  await assert.rejects(
    client.readSession('missing'),
    new Error('Unknown thread: missing'),
  )
})

void test('does not interrupt a session without an active turn', async () => {
  const client = createClient({ threads: [createThread(1)] })
  await client.stopSession('thread-1')
  const session = await client.readSession('thread-1')
  assert.deepEqual(session.status, { type: 'idle' })
})
