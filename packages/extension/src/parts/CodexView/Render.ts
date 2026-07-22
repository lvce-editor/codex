/* eslint-disable unicorn/max-nested-calls */
import { VirtualDomElements } from '@lvce-editor/virtual-dom-worker'
import type {
  CodexThread,
  CodexTurn,
  ThreadItem,
} from '../CodexTypes/CodexTypes.ts'
import {
  button,
  div,
  element,
  flatten,
  heading,
  input,
  paragraph,
  span,
  textArea,
  textNode,
  type TreeNode,
} from '../VirtualDom/VirtualDom.ts'
import { getDisplayStatus, isActive } from './Status.ts'

const upperCaseLetterRegex = /([A-Z])/g

export interface CodexViewState {
  cwd: string
  error: string
  loading: boolean
  mode: 'detail' | 'list' | 'new'
  prompt: string
  selectedSession: CodexThread | undefined
  sessions: readonly CodexThread[]
  starting: boolean
  stoppingThreadId: string
}

const getTitle = (thread: Readonly<CodexThread>): string =>
  thread.name || thread.preview || 'Untitled session'

const formatTime = (value: number): string => {
  if (!value) {
    return ''
  }
  return new Date(value * 1000).toLocaleString()
}

const renderStatus = (thread: Readonly<CodexThread>): TreeNode => {
  const status = getDisplayStatus(thread.status)
  return element(
    VirtualDomElements.Span,
    `CodexStatus CodexStatus${status.className}`,
    [textNode(status.label)],
    { name: `status:${thread.id}` },
  )
}

const renderSession = (
  thread: Readonly<CodexThread>,
  stopping: boolean,
): TreeNode =>
  div('CodexSession', [
    element(
      VirtualDomElements.Button,
      'CodexSessionOpen',
      [
        div('CodexSessionTop', [
          heading(3, 'CodexSessionTitle', getTitle(thread)),
          renderStatus(thread),
        ]),
        paragraph('CodexSessionCwd', thread.cwd),
        span('CodexSessionTime', formatTime(thread.updatedAt)),
      ],
      { name: `session:${thread.id}`, onClick: 'handleClick' },
    ),
    ...(isActive(thread.status)
      ? [
          button(
            `stop:${thread.id}`,
            stopping ? 'Stopping…' : 'Stop',
            'CodexButton CodexButtonDanger CodexSessionStop',
          ),
        ]
      : []),
  ])

const renderHeader = (title: string, actions: readonly TreeNode[]): TreeNode =>
  element(VirtualDomElements.Header, 'CodexHeader', [
    heading(2, 'CodexTitle', title),
    div('CodexHeaderActions', actions),
  ])

const renderList = (state: Readonly<CodexViewState>): TreeNode => {
  const content =
    state.sessions.length > 0
      ? div(
          'CodexSessionList',
          state.sessions.map((thread) =>
            renderSession(thread, state.stoppingThreadId === thread.id),
          ),
        )
      : div('CodexEmpty', [
          heading(3, 'CodexEmptyTitle', 'No Codex sessions yet'),
          paragraph(
            'CodexEmptyText',
            'Start a session to ask Codex to work in this workspace.',
          ),
          button(
            'newSession',
            'Start a session',
            'CodexButton CodexButtonPrimary',
          ),
        ])
  return div('CodexRoot', [
    renderHeader('Codex', [
      button('refresh', 'Refresh', 'CodexButton CodexButtonSecondary'),
      button('newSession', 'New session', 'CodexButton CodexButtonPrimary'),
    ]),
    ...(state.error
      ? [div('CodexError', [paragraph('CodexErrorMessage', state.error)])]
      : []),
    ...(state.loading && state.sessions.length === 0
      ? [paragraph('CodexLoading', 'Loading sessions…')]
      : [content]),
  ])
}

const renderNewSession = (state: Readonly<CodexViewState>): TreeNode =>
  div('CodexRoot', [
    renderHeader('New Codex session', [
      button('cancelNewSession', 'Cancel', 'CodexButton CodexButtonSecondary'),
    ]),
    div('CodexComposer', [
      element(VirtualDomElements.Label, 'CodexLabel', [
        textNode('Workspace'),
        input('cwd', state.cwd, 'Absolute workspace path'),
      ]),
      element(VirtualDomElements.Label, 'CodexLabel', [
        textNode('What should Codex do?'),
        textArea('prompt', state.prompt, 'Describe a task for Codex'),
      ]),
      ...(state.error ? [paragraph('CodexErrorMessage', state.error)] : []),
      button(
        'startSession',
        state.starting ? 'Starting…' : 'Start session',
        'CodexButton CodexButtonPrimary CodexStartButton',
      ),
    ]),
  ])

const getItemText = (item: Readonly<ThreadItem>): string => {
  const record: Readonly<Record<string, unknown>> = item
  if (item.type === 'userMessage' && Array.isArray(record.content)) {
    return record.content
      .filter(
        (entry): entry is { readonly text: string; readonly type: 'text' } =>
          Boolean(
            entry &&
            typeof entry === 'object' &&
            'type' in entry &&
            entry.type === 'text' &&
            'text' in entry &&
            typeof entry.text === 'string',
          ),
      )
      .map((entry) => entry.text)
      .join('\n')
  }
  if (
    (item.type === 'agentMessage' || item.type === 'plan') &&
    typeof record.text === 'string'
  ) {
    return record.text
  }
  if (item.type === 'commandExecution' && typeof record.command === 'string') {
    return record.command
  }
  return item.type.replaceAll(upperCaseLetterRegex, ' $1').trim()
}

const getItemLabel = (item: Readonly<ThreadItem>): string => {
  switch (item.type) {
    case 'agentMessage':
      return 'Codex'
    case 'commandExecution':
      return 'Command'
    case 'plan':
      return 'Plan'
    case 'userMessage':
      return 'You'
    default:
      return 'Activity'
  }
}

const renderItem = (item: Readonly<ThreadItem>): TreeNode =>
  div(`CodexTranscriptItem CodexTranscriptItem${item.type}`, [
    span('CodexTranscriptLabel', getItemLabel(item)),
    paragraph('CodexTranscriptText', getItemText(item)),
  ])

const renderTurn = (turn: Readonly<CodexTurn>): TreeNode =>
  div('CodexTurn', [
    div('CodexTurnHeader', [
      span('CodexTurnStatus', turn.status),
      span('CodexTurnTime', formatTime(turn.startedAt || 0)),
    ]),
    ...turn.items.map(renderItem),
    ...(turn.error?.message
      ? [paragraph('CodexErrorMessage', turn.error.message)]
      : []),
  ])

const renderDetail = (state: Readonly<CodexViewState>): TreeNode => {
  const thread = state.selectedSession
  if (!thread) {
    return renderList(state)
  }
  return div('CodexRoot', [
    renderHeader(getTitle(thread), [
      button('back', 'Back', 'CodexButton CodexButtonSecondary'),
      ...(isActive(thread.status)
        ? [
            button(
              `stop:${thread.id}`,
              state.stoppingThreadId ? 'Stopping…' : 'Stop',
              'CodexButton CodexButtonDanger',
            ),
          ]
        : []),
    ]),
    div('CodexDetailMeta', [
      renderStatus(thread),
      paragraph('CodexDetailCwd', thread.cwd),
      span('CodexDetailId', thread.id),
    ]),
    ...(state.error ? [paragraph('CodexErrorMessage', state.error)] : []),
    div(
      'CodexTranscript',
      thread.turns.length > 0
        ? thread.turns.map(renderTurn)
        : [paragraph('CodexEmptyText', 'This session has no turns yet.')],
    ),
  ])
}

export const render = (
  state: Readonly<CodexViewState>,
): ReturnType<typeof flatten> => {
  if (state.mode === 'new') {
    return flatten(renderNewSession(state))
  }
  if (state.mode === 'detail') {
    return flatten(renderDetail(state))
  }
  return flatten(renderList(state))
}
