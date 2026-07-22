import { packageExtension } from '@lvce-editor/package-extension'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path, { join } from 'node:path'
import { type Plugin, rollup } from 'rollup'
import { build as esbuildBuild } from 'esbuild'
import esbuildPlugin from 'rollup-plugin-esbuild'
import {
  type ExtensionManifest,
  withProductionNodeEntryPoint,
} from './extensionManifest.ts'
import { root } from './root.ts'

const extension = path.join(root, 'packages', 'extension')
const node = path.join(root, 'packages', 'node')
const require = createRequire(import.meta.url)
const commonjs = require('@rollup/plugin-commonjs') as () => Plugin

fs.rmSync(join(root, 'dist'), { recursive: true, force: true })

fs.mkdirSync(path.join(root, 'dist'))

fs.copyFileSync(join(root, 'README.md'), join(root, 'dist', 'README.md'))
const extensionManifest = JSON.parse(
  fs.readFileSync(join(extension, 'extension.json'), 'utf8'),
) as ExtensionManifest
fs.writeFileSync(
  join(root, 'dist', 'extension.json'),
  `${JSON.stringify(withProductionNodeEntryPoint(extensionManifest), undefined, 2)}\n`,
)
fs.cpSync(join(extension, 'media'), join(root, 'dist', 'media'), {
  recursive: true,
})
await esbuildBuild({
  bundle: true,
  entryPoints: [
    join(node, 'src', 'codexClient.ts'),
    join(node, 'src', 'mockCodex.ts'),
  ],
  format: 'esm',
  outdir: join(root, 'dist', 'node', 'dist'),
  platform: 'node',
  target: 'node24',
})

const bundle = await rollup({
  input: join(extension, 'src', 'codexMain.ts'),
  external: ['electron', 'node:*'],
  plugins: [
    nodeResolve({
      browser: true,
    }),
    commonjs(),
    esbuildPlugin({
      target: 'esnext',
    }),
  ],
  treeshake: {
    moduleSideEffects: false,
  },
})

await bundle.write({
  file: join(root, 'dist', 'dist', 'codexMain.js'),
  format: 'esm',
})

await bundle.close()

await packageExtension({
  highestCompression: true,
  inDir: join(root, 'dist'),
  outFile: join(root, 'extension.tar.br'),
})
