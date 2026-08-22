import { NodeRpcProcess } from '@lvce-editor/rpc'
import { commandMap } from './codexClient.ts'

await NodeRpcProcess.create({ commandMap })
