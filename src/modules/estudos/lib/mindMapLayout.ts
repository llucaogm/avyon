export interface MindMapNode {
  titulo: string
  filhos: MindMapNode[]
}

export interface PositionedNode {
  id: string
  titulo: string
  x: number
  y: number
  depth: number
  /** Present only on a node whose children are all leaves — they're absorbed
   * here as a bullet list instead of being placed as separate radial nodes,
   * since a "detalhes" level fans out too fast to lay out cleanly. */
  detalhes?: string[]
}

/** Manual overrides from dragging nodes — keyed by `PositionedNode.id`,
 * persisted as `mapas_mentais.posicoes` so a reposition survives a reload. */
export type NodePositions = Record<string, { x: number; y: number }>

/** References node ids rather than frozen coordinates, so a caller that
 * repositions a node (drag) can still draw the edge to wherever it ended up. */
export interface MindMapEdge {
  fromId: string
  toId: string
}

/** Distance from a node to its children, indexed by the parent's depth (root = 0). */
const RADIUS_STEPS = [240, 210]

/** Box size per depth — shared by MindMapCanvas (on-screen) and mindMapExport
 * (PNG download) so the two never quietly drift apart. */
export function nodeSize(depth: number): { w: number; h: number } {
  if (depth === 0) return { w: 210, h: 68 }
  if (depth === 1) return { w: 180, h: 60 }
  return { w: 230, h: 108 }
}

/** A node is terminal for layout purposes once its own children are all leaves —
 * they stop being placed as separate nodes and become inline bullet text instead. */
function isTerminal(node: MindMapNode): boolean {
  return node.filhos.length === 0 || node.filhos.every((child) => child.filhos.length === 0)
}

function countTerminals(node: MindMapNode): number {
  if (isTerminal(node)) return 1
  return node.filhos.reduce((sum, child) => sum + countTerminals(child), 0)
}

/**
 * Radial dendrogram layout: the root sits at the origin, each node's children
 * fan out across the angular slice it inherited from its own position in its
 * parent's fan — so a subtree never overlaps a sibling subtree.
 *
 * Each child's share of that slice is weighted by how many terminal nodes live
 * under it (not divided equally) — otherwise a branch with many descendants
 * gets squeezed into the same angle as a sibling with few, and everything
 * overlaps. Recursion stops one level early (see `isTerminal`) so a bushy
 * "details" level never has to fight for its own angular space.
 */
export function layoutRadialTree(root: MindMapNode): { nodes: PositionedNode[]; edges: MindMapEdge[] } {
  const nodes: PositionedNode[] = []
  const edges: MindMapEdge[] = []
  let counter = 0

  function place(
    node: MindMapNode,
    depth: number,
    x: number,
    y: number,
    angleStart: number,
    angleEnd: number,
    parentId?: string,
  ) {
    const id = `n${counter++}`
    const terminal = isTerminal(node)
    nodes.push({
      id,
      titulo: node.titulo,
      x,
      y,
      depth,
      detalhes: terminal && node.filhos.length > 0 ? node.filhos.map((f) => f.titulo) : undefined,
    })
    if (parentId) edges.push({ fromId: parentId, toId: id })
    if (terminal) return

    const children = node.filhos
    const step = RADIUS_STEPS[Math.min(depth, RADIUS_STEPS.length - 1)]
    const span = angleEnd - angleStart
    const totalTerminals = children.reduce((sum, child) => sum + countTerminals(child), 0)

    let cursor = angleStart
    children.forEach((child) => {
      const childSpan = span * (countTerminals(child) / totalTerminals)
      const angle = cursor + childSpan / 2
      const cx = x + step * Math.cos(angle)
      const cy = y + step * Math.sin(angle)
      place(child, depth + 1, cx, cy, cursor, cursor + childSpan, id)
      cursor += childSpan
    })
  }

  place(root, 0, 0, 0, 0, Math.PI * 2)
  return { nodes, edges }
}
