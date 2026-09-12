import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { patchWaitingAssertions } from '../src/patchWaitingAssertions.js'

const original = `const checkSingleElementCondition = async () => {};
const checkMultiElementCondition = async () => {};
const checkConditionError = () => {};
`

const createHarness = () => {
  const state = {
    callback: undefined,
    disconnected: false,
    deadline: undefined,
    timerCleared: false,
  }
  const wait = runInNewContext(
    `${patchWaitingAssertions(original)}\nwaitForTestCondition`,
    {
      clearTimeout: () => {
        state.timerCleared = true
      },
      document: { documentElement: {} },
      MutationObserver: class {
        constructor(callback) {
          state.callback = callback
        }
        observe() {}
        disconnect() {
          state.disconnected = true
        }
      },
      setTimeout: (callback) => {
        state.deadline = callback
        return 1
      },
    },
  )
  return { state, wait }
}

test('waits for a matching DOM change and releases the observer and deadline', async () => {
  const { state, wait } = createHarness()
  let visible = false
  let settled = false
  const pending = wait(() => visible).then((result) => {
    settled = true
    return result
  })
  await Promise.resolve()
  assert.equal(settled, false)
  state.callback()
  await Promise.resolve()
  assert.equal(settled, false)
  visible = true
  state.callback()
  assert.equal((await pending).error, false)
  assert.equal(state.disconnected, true)
  assert.equal(state.timerCleared, true)
})

test('accepts a condition that already matches', async () => {
  const { state, wait } = createHarness()
  assert.equal((await wait(() => true)).error, false)
  assert.equal(state.disconnected, true)
  assert.equal(state.timerCleared, true)
})

test('fails when the condition still does not match at the deadline', async () => {
  const { state, wait } = createHarness()
  const pending = wait(() => false)
  state.deadline()
  assert.equal((await pending).error, true)
  assert.equal(state.disconnected, true)
  assert.equal(state.timerCleared, true)
})

test('propagates predicate errors and releases pending resources', async () => {
  const { state, wait } = createHarness()
  await assert.rejects(
    wait(() => {
      throw new Error('invalid selector')
    }),
    /invalid selector/,
  )
  assert.equal(state.disconnected, true)
  assert.equal(state.timerCleared, true)
})

test('applying the server patch twice leaves one implementation', () => {
  const patched = patchWaitingAssertions(original)
  assert.equal(patchWaitingAssertions(patched), patched)
})

test('rejects an incompatible renderer bundle', () => {
  assert.throws(
    () => patchWaitingAssertions(''),
    /assertion functions not found/,
  )
})
