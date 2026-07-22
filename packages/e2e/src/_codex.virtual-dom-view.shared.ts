import type { TestApi } from '@lvce-editor/test-with-playwright'

type Command = TestApi['Command']

export type MockStatus =
  | { readonly type: 'idle' | 'notLoaded' | 'systemError' }
  | {
      readonly activeFlags: readonly (
        | 'waitingOnApproval'
        | 'waitingOnUserInput'
      )[]
      readonly type: 'active'
    }

export interface MockThread {
  readonly cliVersion: string
  readonly createdAt: number
  readonly cwd: string
  readonly id: string
  readonly name: string
  readonly preview: string
  readonly status: MockStatus
  readonly turns: readonly MockTurn[]
  readonly updatedAt: number
}

export interface MockTurn {
  readonly completedAt: number | null
  readonly error: null
  readonly id: string
  readonly items: readonly unknown[]
  readonly startedAt: number
  readonly status: 'completed' | 'inProgress' | 'interrupted'
}

export const activeStatus: MockStatus = { activeFlags: [], type: 'active' }
const finishedStatus: MockStatus = { type: 'idle' }

export const createSession = (
  number: number,
  status: MockStatus = finishedStatus,
): MockThread => ({
  cliVersion: 'mock-1.0.0',
  createdAt: 1_700_000_000 + number,
  cwd: `/workspace/project-${number}`,
  id: `thread-${number}`,
  name: `Session ${number}`,
  preview: `Task ${number}`,
  status,
  turns:
    status.type === 'active'
      ? [
          {
            completedAt: null,
            error: null,
            id: `turn-${number}`,
            items: [
              {
                content: [{ text: `Task ${number}`, type: 'text' }],
                id: `user-${number}`,
                type: 'userMessage',
              },
            ],
            startedAt: 1_700_000_001 + number,
            status: 'inProgress',
          },
        ]
      : [],
  updatedAt: 1_700_000_010 + number,
})

export const createSessions = (
  count: number,
  status: MockStatus = finishedStatus,
): readonly MockThread[] =>
  Array.from({ length: count }, (_, index) => createSession(index + 1, status))

export const useMockDataAndShowCodex = async (
  Command: Command,
  threads: readonly MockThread[],
  pageSize?: number,
): Promise<void> => {
  await Command.executeExtensionCommand('codex.show', {
    ...(pageSize && { pageSize }),
    threads,
  })
}
