export const getLegacyNodeRpcPath = (moduleUrl: string): string => {
  const relativePath = moduleUrl.includes('/packages/extension/dist/')
    ? '../../node/src/codexClient.ts'
    : '../node/dist/codexClient.js'
  const nodeRpcUrl = new URL(relativePath, moduleUrl)
  const nodeRpcPath = decodeURIComponent(nodeRpcUrl.pathname)
  return nodeRpcPath.startsWith('/remote/')
    ? nodeRpcPath.slice('/remote'.length)
    : nodeRpcPath
}
