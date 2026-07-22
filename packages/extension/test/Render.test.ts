import { expect, test } from '@jest/globals'
import type { CodexThread } from '../src/parts/CodexTypes/CodexTypes.ts'
import { render } from '../src/parts/CodexView/Render.ts'

const thread: CodexThread = {
  cliVersion: '0.1.0',
  createdAt: 1_700_000_000,
  cwd: '/workspace/project',
  id: 'thread-1',
  name: 'Fix failing tests',
  preview: 'Fix failing tests',
  status: { activeFlags: [], type: 'active' },
  turns: [],
  updatedAt: 1_700_000_001,
}

const getText = (nodes: readonly Record<string, unknown>[]): string =>
  nodes
    .map((node) => (typeof node.text === 'string' ? node.text : ''))
    .join(' ')

test('renders session names, status, and working directory', () => {
  const nodes = render({
    cwd: '',
    error: '',
    loading: false,
    mode: 'list',
    prompt: '',
    selectedSession: undefined,
    sessions: [thread],
    starting: false,
    stoppingThreadId: '',
  })

  expect(getText(nodes)).toContain('Fix failing tests')
  expect(getText(nodes)).toContain('In progress')
  expect(getText(nodes)).toContain('/workspace/project')
  expect(nodes).toContainEqual(
    expect.objectContaining({ name: 'session:thread-1' }),
  )
  expect(nodes).toContainEqual(
    expect.objectContaining({ name: 'stop:thread-1' }),
  )
})

test('renders a session transcript', () => {
  const selectedSession: CodexThread = {
    ...thread,
    status: { type: 'idle' },
    turns: [
      {
        completedAt: 1_700_000_003,
        error: null,
        id: 'turn-1',
        items: [
          {
            content: [{ text: 'Run the tests', type: 'text' }],
            id: 'user-1',
            type: 'userMessage',
          },
          { id: 'agent-1', text: 'All tests pass.', type: 'agentMessage' },
        ],
        startedAt: 1_700_000_002,
        status: 'completed',
      },
    ],
  }
  const nodes = render({
    cwd: '',
    error: '',
    loading: false,
    mode: 'detail',
    prompt: '',
    selectedSession,
    sessions: [selectedSession],
    starting: false,
    stoppingThreadId: '',
  })

  expect(getText(nodes)).toContain('Run the tests')
  expect(getText(nodes)).toContain('All tests pass.')
  expect(getText(nodes)).toContain('Finished')
})
