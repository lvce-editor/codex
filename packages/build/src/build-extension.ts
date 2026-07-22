import * as esbuild from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import { root } from './root.ts'

const extension = path.join(root, 'packages', 'extension')
const node = path.join(root, 'packages', 'node')
const entryPoint = path.join(extension, 'src', 'codexMain.ts')
const outdir = path.join(extension, 'dist')
const outfile = path.join(outdir, 'codexMain.js')

fs.rmSync(outdir, { recursive: true, force: true })
fs.mkdirSync(outdir, { recursive: true })

await esbuild.build({
  bundle: true,
  entryPoints: [entryPoint],
  external: ['electron', 'node:*'],
  format: 'esm',
  outfile,
  platform: 'browser',
  sourcemap: true,
  target: 'esnext',
})

await esbuild.build({
  bundle: false,
  entryPoints: [
    path.join(node, 'src', 'codexClient.ts'),
    path.join(node, 'src', 'mockCodex.ts'),
  ],
  format: 'esm',
  outdir: path.join(extension, 'node', 'dist'),
  platform: 'node',
  sourcemap: true,
  target: 'node24',
})
