import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react'
import { Plus, Minus, LocateFixed } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { layoutRadialTree, type MindMapNode, type NodePositions } from '@/modules/estudos/lib/mindMapLayout'
import { STUDY_COLORS, studyColorVar } from '@/modules/estudos/lib/studyColors'
import { cn } from '@/shared/lib/utils'

interface Transform {
  x: number
  y: number
  scale: number
}

const MIN_SCALE = 0.4
const MAX_SCALE = 2.5

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function nodeSize(depth: number) {
  if (depth === 0) return { w: 210, h: 68 }
  if (depth === 1) return { w: 180, h: 60 }
  return { w: 230, h: 108 }
}

interface MindMapCanvasProps {
  root: MindMapNode
  posicoes?: NodePositions
  onMoveNode?: (posicoes: NodePositions) => void
}

export function MindMapCanvas({ root, posicoes, onMoveNode }: MindMapCanvasProps) {
  const { nodes, edges } = useMemo(() => layoutRadialTree(root), [root])
  const nodesById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])

  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 800, height: 500 })
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 })

  // Manual overrides from dragging — starts from whatever was persisted, and
  // resets whenever the map is regenerated (posicoes comes back as {}).
  const [positions, setPositions] = useState<NodePositions>(posicoes ?? {})
  const positionsRef = useRef(positions)
  useEffect(() => {
    setPositions(posicoes ?? {})
  }, [posicoes])
  useEffect(() => {
    positionsRef.current = positions
  }, [positions])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null)
  const dragNodeRef = useRef<{
    id: string
    pointerId: number
    startX: number
    startY: number
    baseX: number
    baseY: number
  } | null>(null)

  function handlePointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointersRef.current.size === 1) {
      dragRef.current = { startX: e.clientX, startY: e.clientY, origX: transform.x, origY: transform.y }
    } else if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values())
      pinchRef.current = { startDist: distance(pts[0], pts[1]), startScale: transform.scale }
      dragRef.current = null
    }
  }

  function handlePointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    if (!pointersRef.current.has(e.pointerId)) return
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const pts = Array.from(pointersRef.current.values())
      const dist = distance(pts[0], pts[1])
      const nextScale = clamp(
        pinchRef.current.startScale * (dist / pinchRef.current.startDist),
        MIN_SCALE,
        MAX_SCALE,
      )
      setTransform((t) => ({ ...t, scale: nextScale }))
      return
    }

    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      const drag = dragRef.current
      setTransform((t) => ({ ...t, x: drag.origX + dx, y: drag.origY + dy }))
    }
  }

  function handlePointerUp(e: ReactPointerEvent<SVGSVGElement>) {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size < 2) pinchRef.current = null
    if (pointersRef.current.size === 0) dragRef.current = null
  }

  function handleWheel(e: ReactWheelEvent<SVGSVGElement>) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setTransform((t) => ({ ...t, scale: clamp(t.scale + delta, MIN_SCALE, MAX_SCALE) }))
  }

  function zoomBy(delta: number) {
    setTransform((t) => ({ ...t, scale: clamp(t.scale + delta, MIN_SCALE, MAX_SCALE) }))
  }

  function reset() {
    setTransform({ x: 0, y: 0, scale: 1 })
  }

  // Dragging a node moves that node instead of panning the canvas — stopPropagation
  // keeps the svg's own pointer handlers (pan) from also firing.
  function handleNodePointerDown(e: ReactPointerEvent<HTMLDivElement>, node: { id: string; x: number; y: number }) {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const current = positions[node.id] ?? { x: node.x, y: node.y }
    dragNodeRef.current = {
      id: node.id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseX: current.x,
      baseY: current.y,
    }
  }

  function handleNodePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragNodeRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    e.stopPropagation()
    const dx = (e.clientX - drag.startX) / transform.scale
    const dy = (e.clientY - drag.startY) / transform.scale
    setPositions((prev) => ({ ...prev, [drag.id]: { x: drag.baseX + dx, y: drag.baseY + dy } }))
  }

  function handleNodePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragNodeRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    e.stopPropagation()
    dragNodeRef.current = null
    onMoveNode?.(positionsRef.current)
  }

  function effectivePos(id: string): { x: number; y: number } {
    const override = positions[id]
    if (override) return override
    const node = nodesById.get(id)
    return node ? { x: node.x, y: node.y } : { x: 0, y: 0 }
  }

  const cx = size.width / 2
  const cy = size.height / 2

  return (
    <div ref={containerRef} className="relative h-[65vh] min-h-[420px] overflow-hidden rounded-xl border bg-card">
      <svg
        width={size.width}
        height={size.height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className="touch-none cursor-grab active:cursor-grabbing"
      >
        <g transform={`translate(${cx + transform.x} ${cy + transform.y}) scale(${transform.scale})`}>
          {edges.map((edge, i) => {
            const from = effectivePos(edge.fromId)
            const to = effectivePos(edge.toId)
            return (
              <line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="var(--border)"
                strokeWidth={1.5}
              />
            )
          })}
          {nodes.map((node, i) => {
            const { w, h } = nodeSize(node.depth)
            const pos = effectivePos(node.id)
            const cor = STUDY_COLORS[i % STUDY_COLORS.length]
            const detalhes = node.detalhes?.slice(0, 3)
            const detalhesRestantes = (node.detalhes?.length ?? 0) - (detalhes?.length ?? 0)

            return (
              <foreignObject key={node.id} x={pos.x - w / 2} y={pos.y - h / 2} width={w} height={h}>
                {node.depth <= 1 ? (
                  <div
                    onPointerDown={(e) => handleNodePointerDown(e, node)}
                    onPointerMove={handleNodePointerMove}
                    onPointerUp={handleNodePointerUp}
                    onPointerCancel={handleNodePointerUp}
                    className={cn(
                      'flex h-full w-full cursor-grab items-center justify-center overflow-hidden rounded-2xl px-2.5 py-1 text-center leading-tight break-words touch-none active:cursor-grabbing',
                      node.depth === 0 &&
                        'bg-gradient-brand font-display line-clamp-2 text-sm font-semibold text-primary-foreground',
                      node.depth === 1 && 'line-clamp-2 border text-xs font-medium text-foreground',
                    )}
                    style={
                      node.depth === 1
                        ? {
                            backgroundColor: `color-mix(in oklab, ${studyColorVar(cor)} 22%, var(--card))`,
                            borderColor: studyColorVar(cor),
                          }
                        : undefined
                    }
                  >
                    {node.titulo}
                  </div>
                ) : (
                  <div
                    onPointerDown={(e) => handleNodePointerDown(e, node)}
                    onPointerMove={handleNodePointerMove}
                    onPointerUp={handleNodePointerUp}
                    onPointerCancel={handleNodePointerUp}
                    className="flex h-full w-full cursor-grab touch-none flex-col justify-center gap-1 overflow-hidden rounded-2xl border bg-card px-3 py-2 text-left active:cursor-grabbing"
                  >
                    <p className="line-clamp-2 text-xs font-medium break-words text-foreground">{node.titulo}</p>
                    {detalhes && detalhes.length > 0 && (
                      <ul className="flex flex-col gap-0.5 text-[10px] leading-snug text-muted-foreground">
                        {detalhes.map((d, di) => (
                          <li key={di} className="truncate">
                            • {d}
                          </li>
                        ))}
                        {detalhesRestantes > 0 && <li className="truncate">+{detalhesRestantes} mais</li>}
                      </ul>
                    )}
                  </div>
                )}
              </foreignObject>
            )
          })}
        </g>
      </svg>

      <div className="absolute right-3 bottom-3 flex flex-col gap-1">
        <Button variant="outline" size="icon-sm" onClick={() => zoomBy(0.2)} aria-label="Aproximar">
          <Plus className="size-4" />
        </Button>
        <Button variant="outline" size="icon-sm" onClick={() => zoomBy(-0.2)} aria-label="Afastar">
          <Minus className="size-4" />
        </Button>
        <Button variant="outline" size="icon-sm" onClick={reset} aria-label="Centralizar">
          <LocateFixed className="size-4" />
        </Button>
      </div>
    </div>
  )
}
