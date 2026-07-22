import { decodeMockData } from './parts/MockCodexData/MockCodexData.ts'
import { MockCodexServer } from './parts/MockCodexServer/MockCodexServer.ts'

const server = new MockCodexServer(decodeMockData(process.argv[2]))

server.start()
