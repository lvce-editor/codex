import { expect, test } from '@jest/globals'
import { readFile } from 'node:fs/promises'

test('declares an isolated Codex view and node app-server rpc', async () => {
  const manifestUrl = new URL('../extension.json', import.meta.url)
  const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'))
  const nodeRpc = {
    id: 'builtin.codex.app-server',
    name: 'Codex App Server',
    type: 'node-process',
    url: 'node/dist/codexProcess.js',
  }

  expect(manifest).toEqual(
    expect.objectContaining({
      browser: 'dist/codexMain.js',
      contentSecurityPolicy: ["default-src 'none'", "script-src 'self'"],
      id: 'builtin.codex',
      isolated: true,
    }),
  )
  expect(manifest.rpc).toContainEqual(nodeRpc)
  expect(new URL(nodeRpc.url, manifestUrl).pathname).toContain(
    '/packages/extension/node/dist/codexProcess.js',
  )
  expect(manifest.views).toContainEqual(
    expect.objectContaining({
      css: 'media/codex.css',
      icon: 'media/codex.svg',
      id: 'codex.views.sessions',
    }),
  )
})
