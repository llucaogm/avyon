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
const RADIUS_STEPS = [170, 130, 100]

/**
 * Radial dendrogram layout: the root sits at the origin, each node's children
 * fan out across the angular slice it inherited from its own position in its
 * parent's fan — so a subtree never overlaps a sibling subtree.
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
    const slice = span / children.length
    children.forEach((child, i) => {
      const angle = angleStart + slice * (i + 0.5)
      const cx = x + step * Math.cos(angle)
      const cy = y + step * Math.sin(angle)
      place(child, depth + 1, cx, cy, angle - slice / 2, angle + slice / 2, { x, y })
    })
  }

  place(root, 0, 0, 0, 0, Math.PI * 2)
  return { nodes, edges }
}
