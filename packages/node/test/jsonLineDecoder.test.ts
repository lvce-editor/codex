import assert from 'node:assert/strict'
import { test } from 'node:test'
import { JsonLineDecoder } from '../src/jsonLineDecoder.ts'

void test('decodes messages split across chunks', () => {
  const decoder = new JsonLineDecoder()
  assert.deepEqual(decoder.push('{"id":1'), [])
  assert.deepEqual(decoder.push(',"result":{}}\n'), [{ id: 1, result: {} }])
})

void test('decodes multiple messages and ignores invalid lines', () => {
  const decoder = new JsonLineDecoder()
  assert.deepEqual(
    decoder.push('\nnot json\n{"method":"thread/started"}\n{"id":2}\n'),
    [{ method: 'thread/started' }, { id: 2 }],
  )
})

void test('reset discards an incomplete message', () => {
  const decoder = new JsonLineDecoder()
  decoder.push('{"id":1')
  decoder.reset()
  assert.deepEqual(decoder.push('{"id":2}\n'), [{ id: 2 }])
})
