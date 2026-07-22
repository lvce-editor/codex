import type { ThreadStatus } from '../CodexTypes/CodexTypes.ts'

export interface DisplayStatus {
  readonly className: string
  readonly label: string
}

export const getDisplayStatus = (
  status: Readonly<ThreadStatus>,
): DisplayStatus => {
  if (status.type === 'active') {
    if (status.activeFlags.includes('waitingOnApproval')) {
      return { className: 'Waiting', label: 'Waiting for approval' }
    }
    if (status.activeFlags.includes('waitingOnUserInput')) {
      return { className: 'Waiting', label: 'Waiting for input' }
    }
    return { className: 'Running', label: 'In progress' }
  }
  if (status.type === 'systemError') {
    return { className: 'Error', label: 'Error' }
  }
  return { className: 'Finished', label: 'Finished' }
}

export const isActive = (status: Readonly<ThreadStatus>): boolean =>
  status.type === 'active'
