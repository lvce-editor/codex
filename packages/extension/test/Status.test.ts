import { describe, expect, test } from '@jest/globals'
import { getDisplayStatus } from '../src/parts/Status/Status.ts'

describe('Codex session status', () => {
  test('shows active sessions as in progress', () => {
    expect(getDisplayStatus({ activeFlags: [], type: 'active' })).toEqual({
      className: 'Running',
      label: 'In progress',
    })
  })

  test('shows approval and user-input waits', () => {
    expect(
      getDisplayStatus({
        activeFlags: ['waitingOnApproval'],
        type: 'active',
      }).label,
    ).toBe('Waiting for approval')
    expect(
      getDisplayStatus({
        activeFlags: ['waitingOnUserInput'],
        type: 'active',
      }).label,
    ).toBe('Waiting for input')
  })

  test('shows idle and unloaded sessions as finished', () => {
    expect(getDisplayStatus({ type: 'idle' }).label).toBe('Finished')
    expect(getDisplayStatus({ type: 'notLoaded' }).label).toBe('Finished')
  })

  test('shows system errors', () => {
    expect(getDisplayStatus({ type: 'systemError' })).toEqual({
      className: 'Error',
      label: 'Error',
    })
  })
})
