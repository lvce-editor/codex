import { expect, test } from '@jest/globals'
import { getLegacyNodeRpcPath } from '../src/parts/GetLegacyNodeRpcPath/GetLegacyNodeRpcPath.ts'

test('resolves the bundled node rpc next to the extension bundle', () => {
  const moduleUrl =
    'file:///usr/share/lvce%20editor/extensions/builtin.codex/dist/codexMain.js'

  expect(getLegacyNodeRpcPath(moduleUrl)).toBe(
    '/usr/share/lvce editor/extensions/builtin.codex/node/dist/codexClient.js',
  )
})

test('preserves the leading slash of a Windows drive path', () => {
  const moduleUrl =
    'file:///C:/Program%20Files/LVCE/extensions/builtin.codex/dist/codexMain.js'

  expect(getLegacyNodeRpcPath(moduleUrl)).toBe(
    '/C:/Program Files/LVCE/extensions/builtin.codex/node/dist/codexClient.js',
  )
})
