import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CodexThread } from '../src/appServerTypes.ts'
import { ThreadStatuses } from '../src/threadStatuses.ts'

const thread: CodexThread = {
  id: 'thread-1',
  status: { type: 'idle' },
}

void test('tracks explicit thread status notifications', () => {
  const statuses = new ThreadStatuses()
  statuses.handleNotification({
    method: 'thread/status/changed',
    params: {
      status: { activeFlags: ['waiting'], type: 'active' },
      threadId: thread.id,
    },
  })
  assert.deepEqual(statuses.merge(thread).status, {
    activeFlags: ['waiting'],
    type: 'active',
  })
})

void test('tracks thread started notifications', () => {
  const statuses = new ThreadStatuses()
  statuses.handleNotification({
    method: 'thread/started',
    params: {
      thread: { id: thread.id, status: { type: 'notLoaded' } },
    },
  })
  assert.deepEqual(statuses.merge(thread).status, { type: 'notLoaded' })
})

void test('tracks turn lifecycle notifications', () => {
  const statuses = new ThreadStatuses()
  statuses.handleNotification({
    method: 'turn/started',
    params: { threadId: thread.id },
  })
  assert.deepEqual(statuses.merge(thread).status, {
    activeFlags: [],
    type: 'active',
  })
  statuses.handleNotification({
    method: 'turn/completed',
    params: { threadId: thread.id },
  })
  assert.deepEqual(statuses.merge(thread).status, { type: 'idle' })
})

void test('clear removes tracked statuses', () => {
  const statuses = new ThreadStatuses()
  statuses.setActive(thread.id)
  statuses.clear()
  assert.equal(statuses.merge(thread), thread)
})
