import assert from 'node:assert/strict'
import { test } from 'node:test'
import { asRecord, asThread, toError } from '../src/parts/AppServerProtocol/AppServerProtocol.ts'

void test('accepts protocol records', () => {
  const value = { id: 'thread-1', status: { type: 'idle' } }
  assert.equal(asRecord(value), value)
  assert.equal(asThread(value), value)
})

for (const value of [undefined, null, 'value', 1, []]) {
  void test(`rejects non-record protocol value ${String(value)}`, () => {
    assert.throws(
      () => asRecord(value),
      new TypeError('Codex app-server returned an invalid response'),
    )
  })
}

void test('rejects a thread without an id', () => {
  assert.throws(
    () => asThread({ status: { type: 'idle' } }),
    new TypeError('Codex app-server returned an invalid thread'),
  )
})

void test('includes stderr when converting an error', () => {
  assert.equal(
    toError(new Error('failed'), ' detail\n').message,
    'failed: detail',
  )
})
