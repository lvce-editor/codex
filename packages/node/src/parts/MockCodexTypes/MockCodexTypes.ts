export interface IncomingMessage {
  readonly id?: number
  readonly method?: string
  readonly params?: Readonly<Record<string, unknown>>
}

export interface MockData {
  readonly listDelayMs?: number
  readonly pageSize?: number
  readonly threads?: readonly MockThread[]
}

export interface MockItem {
  readonly [key: string]: unknown
}

export interface MockStatus {
  readonly activeFlags?: readonly string[]
  readonly type: string
}

export interface MockThread {
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

export interface MockTurn {
  completedAt: number | null
  readonly error: null
  readonly id: string
  readonly items: readonly MockItem[]
  readonly startedAt: number
  status: string
}
