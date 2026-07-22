import {
  text,
  VirtualDomElements,
  type VirtualDomNode,
} from '@lvce-editor/virtual-dom-worker'

export interface TreeNode {
  readonly children: readonly TreeNode[]
  readonly node: VirtualDomNode
}

export const textNode = (value: string): TreeNode => ({
  children: [],
  node: text(value),
})

export const node = (
  type: number,
  properties: Readonly<Record<string, unknown>> = {},
  children: readonly TreeNode[] = [],
): TreeNode => ({
  children,
  node: { ...properties, childCount: children.length, type },
})

export const element = (
  type: number,
  className: string,
  children: readonly TreeNode[],
  properties: Readonly<Record<string, unknown>> = {},
): TreeNode => node(type, { className, ...properties }, children)

export const div = (
  className: string,
  children: readonly TreeNode[],
  properties: Readonly<Record<string, unknown>> = {},
): TreeNode => element(VirtualDomElements.Div, className, children, properties)

export const span = (className: string, value: string): TreeNode =>
  element(VirtualDomElements.Span, className, [textNode(value)])

export const heading = (
  level: 1 | 2 | 3,
  className: string,
  value: string,
): TreeNode => {
  const types = {
    1: VirtualDomElements.H1,
    2: VirtualDomElements.H2,
    3: VirtualDomElements.H3,
  }
  return element(types[level], className, [textNode(value)])
}

export const paragraph = (className: string, value: string): TreeNode =>
  element(VirtualDomElements.P, className, [textNode(value)])

export const button = (
  name: string,
  label: string,
  className = 'CodexButton',
): TreeNode =>
  node(
    VirtualDomElements.Button,
    { className, name, onClick: 'handleClick' },
    [textNode(label)],
  )

export const input = (
  name: string,
  value: string,
  placeholder: string,
): TreeNode =>
  node(VirtualDomElements.Input, {
    className: 'CodexInput',
    name,
    onInput: 'handleInput',
    placeholder,
    value,
  })

export const textArea = (
  name: string,
  value: string,
  placeholder: string,
): TreeNode =>
  node(VirtualDomElements.TextArea, {
    className: 'CodexTextArea',
    name,
    onInput: 'handleInput',
    placeholder,
    value,
  })

export const flatten = (tree: TreeNode): readonly VirtualDomNode[] => [
  tree.node,
  ...tree.children.flatMap(flatten),
]
