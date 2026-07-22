import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  productionNodeEntryPoint,
  withProductionNodeEntryPoint,
} from '../src/extensionManifest.ts'

void test('uses the bundled node entry point in production manifests', () => {
  const manifest = withProductionNodeEntryPoint({
    rpc: [
      {
        id: 'builtin.codex.app-server',
        url: '../node/src/codexClient.ts',
      },
    ],
  })

  assert.equal(manifest.rpc[0]?.url, productionNodeEntryPoint)
})

void test('requires the node rpc when creating a production manifest', () => {
  assert.throws(
    () => withProductionNodeEntryPoint({ rpc: [] }),
    /Expected extension manifest to include builtin\.codex\.app-server/,
  )
})
