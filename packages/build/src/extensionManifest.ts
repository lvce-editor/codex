export interface ExtensionRpc {
  readonly id: string
  readonly url: string
}

export interface ExtensionManifest {
  readonly rpc: readonly ExtensionRpc[]
}

const nodeRpcId = 'builtin.codex.app-server'

export const productionNodeEntryPoint = 'node/dist/codexClient.js'

export const withProductionNodeEntryPoint = (
  manifest: Readonly<ExtensionManifest>,
): ExtensionManifest => {
  let foundNodeRpc = false
  const rpc = manifest.rpc.map((entry) => {
    if (entry.id !== nodeRpcId) {
      return entry
    }
    foundNodeRpc = true
    return {
      ...entry,
      url: productionNodeEntryPoint,
    }
  })
  if (!foundNodeRpc) {
    throw new Error(`Expected extension manifest to include ${nodeRpcId}`)
  }
  return {
    ...manifest,
    rpc,
  }
}
