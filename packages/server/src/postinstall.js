import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { patchWaitingAssertions } from './patchWaitingAssertions.js'

const packagePath = fileURLToPath(
  import.meta.resolve('@lvce-editor/static-server/package.json'),
)
const staticPath = join(dirname(packagePath), 'static')
const directories = await readdir(staticPath, { withFileTypes: true })
const commitDirectory = directories.find(
  (entry) => entry.isDirectory() && /^[a-z\d]{7}$/.test(entry.name),
)
if (!commitDirectory) {
  throw new Error('static server asset directory not found')
}
const rendererPath = join(
  staticPath,
  commitDirectory.name,
  'packages/renderer-process/dist/rendererProcessMain.js',
)
const original = await readFile(rendererPath, 'utf8')
const patched = patchWaitingAssertions(original)
if (patched !== original) {
  await writeFile(rendererPath, patched)
}
