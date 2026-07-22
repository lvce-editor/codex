import { expect, jest, test } from '@jest/globals'
import { createCodexClient } from '../src/parts/CodexClient/CodexClient.ts'

test('uses the declared node rpc for session operations', async () => {
  const invoke = jest.fn(async (method: string, ..._params: readonly unknown[]) => {
    if (method === 'Codex.listSessions') {
      return []
    }
    return undefined
  })
  const dispose = jest.fn(async () => {})
  const client = await createCodexClient({
    createRpc: async () => ({ dispose, invoke }),
    executable: '/usr/local/bin/codex',
  })

  await client.listSessions()
  await client.stopSession('thread-1')
  await client.dispose()

  expect(invoke).toHaveBeenNthCalledWith(1, 'Codex.configure', {
    executable: '/usr/local/bin/codex',
  })
  expect(invoke).toHaveBeenCalledWith('Codex.listSessions')
  expect(invoke).toHaveBeenCalledWith('Codex.stopSession', 'thread-1')
  expect(dispose).toHaveBeenCalledTimes(1)
})

test('configures the standalone mock through the node rpc', async () => {
  const invoke = jest.fn(async (..._params: readonly unknown[]) => [])
  await createCodexClient({
    createRpc: async () => ({ dispose: async () => {}, invoke }),
    mockData: { threads: [] },
  })

  expect(invoke).toHaveBeenCalledWith('Codex.test.useMockData', {
    threads: [],
  })
})
