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
}

export interface MindMapEdge {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** Distance from a node to its children, indexed by the parent's depth (root = 0). */
const RADIUS_STEPS = [230, 190, 160]

function countLeaves(node: MindMapNode): number {
  if (node.filhos.length === 0) return 1
  return node.filhos.reduce((sum, child) => sum + countLeaves(child), 0)
}

/**
 * Radial dendrogram layout: the root sits at the origin, each node's children
 * fan out across the angular slice it inherited from its own position in its
 * parent's fan — so a subtree never overlaps a sibling subtree.
 *
 * Each child's share of that slice is weighted by how many leaves live under
 * it (not divided equally) — otherwise a branch with 10 leaves gets squeezed
 * into the same angle as a sibling branch with 2, and everything overlaps.
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
    parent?: { x: number; y: number },
  ) {
    const id = `n${counter++}`
    nodes.push({ id, titulo: node.titulo, x, y, depth })
    if (parent) edges.push({ x1: parent.x, y1: parent.y, x2: x, y2: y })

    const children = node.filhos
    if (children.length === 0) return

    const step = RADIUS_STEPS[Math.min(depth, RADIUS_STEPS.length - 1)]
    const span = angleEnd - angleStart
    const totalLeaves = children.reduce((sum, child) => sum + countLeaves(child), 0)

    let cursor = angleStart
    children.forEach((child) => {
      const childSpan = span * (countLeaves(child) / totalLeaves)
      const angle = cursor + childSpan / 2
      const cx = x + step * Math.cos(angle)
      const cy = y + step * Math.sin(angle)
      place(child, depth + 1, cx, cy, cursor, cursor + childSpan, { x, y })
      cursor += childSpan
    })
  }

  place(root, 0, 0, 0, 0, Math.PI * 2)
  return { nodes, edges }
}
