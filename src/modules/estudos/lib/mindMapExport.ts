import { layoutRadialTree, nodeSize, type MindMapNode, type NodePositions } from '@/modules/estudos/lib/mindMapLayout'
import { STUDY_COLORS, studyColorVar } from '@/modules/estudos/lib/studyColors'

const PADDING = 60
const SCALE = 2 // roughly retina — the on-screen canvas has no fixed resolution to match

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** `var(--foo)` → the resolved value of `--foo` — canvas fillStyle can't
 * resolve custom properties itself, there's no element context for it. */
function resolveVarRef(ref: string): string {
  const match = /var\((--[\w-]+)\)/.exec(ref)
  return match ? cssVar(match[1]) : ref
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  let s = text
  while (s.length > 0 && ctx.measureText(`${s}…`).width > maxWidth) {
    s = s.slice(0, -1)
  }
  return `${s}…`
}

/** Wraps to at most `maxLines`, ellipsizing the last line if there's more text —
 * a canvas approximation of the `line-clamp` the on-screen cards use. Handles a
 * single word wider than `maxWidth` on its own (forced-truncates it) instead of
 * letting it overflow unbounded — canvas text has no automatic word-wrap or
 * clipping the way CSS does. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  let i = 0

  for (; i < words.length; i++) {
    const word = words[i]
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width <= maxWidth) {
      current = test
      continue
    }
    if (current) {
      lines.push(current)
      current = ''
      if (lines.length === maxLines) break
      i--
      continue
    }
    lines.push(truncateToWidth(ctx, word, maxWidth))
    current = ''
    if (lines.length === maxLines) {
      i++
      break
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current)
    i = words.length
  }

  if (i < words.length && lines.length > 0) {
    lines[lines.length - 1] = truncateToWidth(ctx, lines[lines.length - 1].replace(/…$/, ''), maxWidth)
  }
  return lines
}

function drawCenteredLines(ctx: CanvasRenderingContext2D, lines: string[], cx: number, cy: number, lineHeight: number) {
  const startY = cy - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((line, i) => ctx.fillText(line, cx, startY + i * lineHeight))
}

function slugify(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/\p{Mn}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'mapa-mental'
  )
}

interface ExportOptions {
  root: MindMapNode
  posicoes: NodePositions
  titulo: string
}

/** Redraws the mind map on an offscreen canvas from the same layout data the
 * screen uses, and downloads it as a PNG. A parallel Canvas 2D renderer
 * instead of serializing the live SVG — the SVG relies on foreignObject +
 * CSS custom properties that don't survive being rasterized standalone. */
export async function exportMindMapPng({ root, posicoes, titulo }: ExportOptions): Promise<void> {
  await document.fonts.ready

  const { nodes, edges } = layoutRadialTree(root)
  const nodeById = new Map(nodes.map((n) => [n.id, n]))
  const effectivePos = (id: string) => posicoes[id] ?? nodeById.get(id) ?? { x: 0, y: 0 }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const node of nodes) {
    const pos = effectivePos(node.id)
    const { w, h } = nodeSize(node.depth)
    minX = Math.min(minX, pos.x - w / 2)
    maxX = Math.max(maxX, pos.x + w / 2)
    minY = Math.min(minY, pos.y - h / 2)
    maxY = Math.max(maxY, pos.y + h / 2)
  }

  const width = maxX - minX + PADDING * 2
  const height = maxY - minY + PADDING * 2
  const originX = -minX + PADDING
  const originY = -minY + PADDING

  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(width * SCALE)
  canvas.height = Math.ceil(height * SCALE)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D não suportado')
  ctx.scale(SCALE, SCALE)

  const colors = {
    background: cssVar('--background'),
    card: cssVar('--card'),
    border: cssVar('--border'),
    foreground: cssVar('--foreground'),
    primaryForeground: cssVar('--primary-foreground'),
    mutedForeground: cssVar('--muted-foreground'),
    brandTeal: cssVar('--brand-teal'),
    brandBlue: cssVar('--brand-blue'),
  }

  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = colors.border
  ctx.lineWidth = 1.5
  for (const edge of edges) {
    const from = effectivePos(edge.fromId)
    const to = effectivePos(edge.toId)
    ctx.beginPath()
    ctx.moveTo(from.x + originX, from.y + originY)
    ctx.lineTo(to.x + originX, to.y + originY)
    ctx.stroke()
  }

  nodes.forEach((node, i) => {
    const pos = effectivePos(node.id)
    const { w, h } = nodeSize(node.depth)
    const x = pos.x + originX - w / 2
    const y = pos.y + originY - h / 2
    const cx = pos.x + originX
    const cy = pos.y + originY
    const cor = resolveVarRef(studyColorVar(STUDY_COLORS[i % STUDY_COLORS.length]))

    roundedRectPath(ctx, x, y, w, h, 18)
    if (node.depth === 0) {
      const grad = ctx.createLinearGradient(x, y, x + w, y + h)
      grad.addColorStop(0, colors.brandTeal)
      grad.addColorStop(1, colors.brandBlue)
      ctx.fillStyle = grad
      ctx.fill()
    } else if (node.depth === 1) {
      ctx.fillStyle = `color-mix(in oklab, ${cor} 22%, ${colors.card})`
      ctx.fill()
      ctx.strokeStyle = cor
      ctx.lineWidth = 1
      ctx.stroke()
    } else {
      ctx.fillStyle = colors.card
      ctx.fill()
      ctx.strokeStyle = colors.border
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Text is clipped to the node's own box — canvas has no `overflow: hidden`,
    // so without this a long word or an off-by-one wrap would spill visually
    // into whatever's drawn next (neighbouring nodes, edges) instead of just
    // being cut off cleanly at the box edge like the on-screen CSS version.
    ctx.save()
    roundedRectPath(ctx, x, y, w, h, 18)
    ctx.clip()

    if (node.depth <= 1) {
      ctx.fillStyle = node.depth === 0 ? colors.primaryForeground : colors.foreground
      ctx.font = node.depth === 0 ? "600 14px 'Space Grotesk Variable', sans-serif" : "500 12px 'Geist Variable', sans-serif"
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const lines = wrapLines(ctx, node.titulo, w - 24, 2)
      drawCenteredLines(ctx, lines, cx, cy, 16)
    } else {
      const innerX = x + 14
      const innerWidth = w - 28
      ctx.fillStyle = colors.foreground
      ctx.font = "500 12px 'Geist Variable', sans-serif"
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      const titleLines = wrapLines(ctx, node.titulo, innerWidth, 2)
      let cursorY = y + 22
      titleLines.forEach((line, li) => {
        ctx.fillText(line, innerX, cursorY + li * 15)
      })
      cursorY += titleLines.length * 15 + 10

      const detalhes = node.detalhes?.slice(0, 3) ?? []
      const detalhesRestantes = (node.detalhes?.length ?? 0) - detalhes.length
      ctx.fillStyle = colors.mutedForeground
      ctx.font = "400 10px 'Geist Variable', sans-serif"
      for (const detalhe of detalhes) {
        const [line] = wrapLines(ctx, `• ${detalhe}`, innerWidth, 1)
        ctx.fillText(line, innerX, cursorY)
        cursorY += 13
      }
      if (detalhesRestantes > 0) {
        ctx.fillText(`+${detalhesRestantes} mais`, innerX, cursorY)
      }
    }

    ctx.restore()
  })

  const dataUrl = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `${slugify(titulo)}.png`
  a.click()
}
