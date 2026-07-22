export type ThreadActiveFlag = 'waitingOnApproval' | 'waitingOnUserInput'

export type ThreadStatus =
  | { readonly type: 'notLoaded' }
  | { readonly type: 'idle' }
  | { readonly type: 'systemError' }
  | {
      readonly activeFlags: readonly ThreadActiveFlag[]
      readonly type: 'active'
    }

export type TurnStatus = 'completed' | 'failed' | 'inProgress' | 'interrupted'

export interface TextInput {
  readonly text: string
  readonly type: 'text'
}

export type ThreadItem =
  | {
      readonly content: readonly TextInput[]
      readonly id: string
      readonly type: 'userMessage'
    }
  | {
      readonly id: string
      readonly text: string
      readonly type: 'agentMessage' | 'plan'
    }
  | {
      readonly command: string
      readonly id: string
      readonly status: string
      readonly type: 'commandExecution'
    }
  | {
      readonly id: string
      readonly type: string
      readonly [key: string]: unknown
    }

export interface CodexTurn {
  readonly completedAt: number | null
  readonly error: { readonly message?: string } | null
  readonly id: string
  readonly items: readonly ThreadItem[]
  readonly startedAt: number | null
  readonly status: TurnStatus
}

export interface CodexThread {
  readonly cliVersion: string
  readonly createdAt: number
  readonly cwd: string
  readonly id: string
  readonly name: string | null
  readonly preview: string
  readonly status: ThreadStatus
  readonly turns: readonly CodexTurn[]
  readonly updatedAt: number
}

export interface StartSessionOptions {
  readonly cwd: string
  readonly prompt: string
}

export interface MockCodexData {
  readonly pageSize?: number
  readonly threads?: readonly CodexThread[]
}
