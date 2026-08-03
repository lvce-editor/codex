export const getLegacyNodeRpcPath = (moduleUrl: string): string => {
  const nodeRpcUrl = new URL('../node/dist/codexClient.js', moduleUrl)
  return decodeURIComponent(nodeRpcUrl.pathname)
}
