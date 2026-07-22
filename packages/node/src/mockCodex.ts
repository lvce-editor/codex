import { decodeMockData } from './mockCodexData.ts'
import { MockCodexServer } from './mockCodexServer.ts'

const server = new MockCodexServer(decodeMockData(process.argv[2]))

server.start()
