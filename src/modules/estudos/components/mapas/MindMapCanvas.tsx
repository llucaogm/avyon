import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react'
import { Plus, Minus, LocateFixed } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { layoutRadialTree, type MindMapNode } from '@/modules/estudos/lib/mindMapLayout'
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

export function MindMapCanvas({ root }: { root: MindMapNode }) {
  const { nodes, edges } = useMemo(() => layoutRadialTree(root), [root])

  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 800, height: 500 })
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 })

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
          {edges.map((edge, i) => (
            <line
              key={i}
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              stroke="var(--border)"
              strokeWidth={1.5}
            />
          ))}
          {nodes.map((node, i) => {
            const { w, h } = nodeSize(node.depth)
            const cor = STUDY_COLORS[i % STUDY_COLORS.length]
            const detalhes = node.detalhes?.slice(0, 3)
            const detalhesRestantes = (node.detalhes?.length ?? 0) - (detalhes?.length ?? 0)

            return (
              <foreignObject key={node.id} x={node.x - w / 2} y={node.y - h / 2} width={w} height={h}>
                {node.depth <= 1 ? (
                  <div
                    className={cn(
                      'flex h-full w-full items-center justify-center overflow-hidden rounded-2xl px-2.5 py-1 text-center leading-tight break-words',
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
                  <div className="flex h-full w-full flex-col justify-center gap-1 overflow-hidden rounded-2xl border bg-card px-3 py-2 text-left">
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
