import type { MockData } from '../MockCodexTypes/MockCodexTypes.ts'

export const decodeMockData = (value: string | undefined): MockData => {
  if (!value) {
    return {}
  }
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString()) as MockData
  } catch {
    return {}
  }
}
