import type {
  AppServerMessage,
  CodexThread,
  ThreadStatus,
} from '../AppServerTypes/AppServerTypes.ts'
import { asThread } from '../AppServerProtocol/AppServerProtocol.ts'

export class ThreadStatuses {
  private readonly statuses = new Map<string, ThreadStatus>()

  clear(): void {
    this.statuses.clear()
  }

  handleNotification(message: Readonly<AppServerMessage>): void {
    if (message.method === 'thread/status/changed') {
      const status = message.params?.status as ThreadStatus | undefined
      const threadId = message.params?.threadId
      if (typeof threadId === 'string' && status) {
        this.statuses.set(threadId, status)
      }
      return
    }
    if (message.method === 'thread/started') {
      const threadValue = message.params?.thread
      if (threadValue) {
        const thread = asThread(threadValue)
        this.statuses.set(thread.id, thread.status)
      }
      return
    }
    const threadId = message.params?.threadId
    if (typeof threadId !== 'string') {
      return
    }
    if (message.method === 'turn/started') {
      this.setActive(threadId)
    } else if (message.method === 'turn/completed') {
      this.setIdle(threadId)
    }
  }

  merge(thread: Readonly<CodexThread>): CodexThread {
    const status = this.statuses.get(thread.id)
    return status ? { ...thread, status } : thread
  }

  setActive(threadId: string): void {
    this.statuses.set(threadId, { activeFlags: [], type: 'active' })
  }

  setIdle(threadId: string): void {
    this.statuses.set(threadId, { type: 'idle' })
  }
}
