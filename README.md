# builtin.codex

Codex integration for Lvce Editor. It lists local Codex sessions, shows their
status and transcript, and can start or interrupt sessions through
`codex app-server`.

The extension is split into an isolated web worker for UI and session state and
a small Node RPC package for spawning and communicating with Codex.

## Development

```sh
npm ci
npm run build
npm test
```
