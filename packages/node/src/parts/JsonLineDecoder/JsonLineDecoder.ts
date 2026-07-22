import type { AppServerMessage } from '../AppServerTypes/AppServerTypes.ts'

export class JsonLineDecoder {
  private buffer = ''

  push(chunk: string): readonly AppServerMessage[] {
    const messages: AppServerMessage[] = []
    this.buffer += chunk
    while (true) {
      const newline = this.buffer.indexOf('\n')
      if (newline === -1) {
        return messages
      }
      const line = this.buffer.slice(0, newline)
      this.buffer = this.buffer.slice(newline + 1)
      if (!line.trim()) {
        continue
      }
      try {
        messages.push(JSON.parse(line) as AppServerMessage)
      } catch {
        // Ignore non-protocol output from the app-server.
      }
    }
  }

  reset(): void {
    this.buffer = ''
  }
}
