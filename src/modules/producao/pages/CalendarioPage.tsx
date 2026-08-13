import { useMemo, useState, type CSSProperties } from 'react'
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { usePosts, useUpdatePost, useDeletePost } from '@/modules/producao/hooks/usePosts'
import { PostFormDialog } from '@/modules/producao/components/producao/PostFormDialog'
import { monthMatrix, isoDate, MONTHS, WEEKDAYS } from '@/modules/producao/lib/calendarGrid'
import {
  PLATAFORMA_CORES,
  PLATAFORMA_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
  TIPO_LABELS,
} from '@/modules/producao/lib/plataformaCores'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { EmptyState } from '@/shared/components/common/EmptyState'
import { formatDate } from '@/shared/lib/formatters'
import { cn } from '@/shared/lib/utils'
import type { Tables } from '@/shared/types/database.types'

export default function CalendarioPage() {
  const { data: posts = [], isLoading } = usePosts()
  const updatePost = useUpdatePost()
  const deletePost = useDeletePost()

  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [filterDate, setFilterDate] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Tables<'posts'> | undefined>()

  const cells = useMemo(() => monthMatrix(viewYear, viewMonth), [viewYear, viewMonth])

  const postsByDate = useMemo(() => {
    const map = new Map<string, Tables<'posts'>[]>()
    for (const post of posts) {
      if (!post.data_publicacao) continue
      const list = map.get(post.data_publicacao) ?? []
      list.push(post)
      map.set(post.data_publicacao, list)
    }
    return map
  }, [posts])

  function changeMonth(delta: number) {
    let m = viewMonth + delta
    let y = viewYear
    if (m < 0) {
      m = 11
      y -= 1
    } else if (m > 11) {
      m = 0
      y += 1
    }
    setViewMonth(m)
    setViewYear(y)
  }

  function openNew() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(post: Tables<'posts'>) {
    setEditing(post)
    setFormOpen(true)
  }

  const visiblePosts = useMemo(() => {
    return posts
      .filter((p) => !filterDate || p.data_publicacao === filterDate)
      .sort((a, b) => (a.data_publicacao ?? '9999').localeCompare(b.data_publicacao ?? '9999'))
  }, [posts, filterDate])

  const todayIsoStr = today.toISOString().slice(0, 10)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Calendário</h1>
          <p className="text-sm text-muted-foreground">Programe suas postagens.</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" />
          Nova postagem
        </Button>
      </div>

      <Card className="animate-fade-in-up">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon-sm" onClick={() => changeMonth(-1)} aria-label="Mês anterior">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="font-display text-sm font-semibold">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <Button variant="ghost" size="icon-sm" onClick={() => changeMonth(1)} aria-label="Próximo mês">
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w, i) => (
              <div key={i} className="text-[10px] text-muted-foreground">
                {w}
              </div>
            ))}
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const iso = isoDate(viewYear, viewMonth, day)
              const dayPosts = postsByDate.get(iso) ?? []
              const isToday = iso === todayIsoStr
              const isSelected = filterDate === iso
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => setFilterDate(isSelected ? null : iso)}
                  className={cn(
                    'press-feedback flex flex-col items-center gap-0.5 rounded-md border border-transparent py-1.5 text-[11px] transition-colors',
                    isToday && 'text-primary',
                    isSelected && 'border-primary bg-primary/10',
                  )}
                >
                  {day}
                  <span className="flex h-1.5 gap-0.5">
                    {dayPosts.slice(0, 3).map((p) => (
                      <span
                        key={p.id}
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: PLATAFORMA_CORES[p.plataforma] }}
                      />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {filterDate && (
        <button
          type="button"
          onClick={() => setFilterDate(null)}
          className="press-feedback self-start text-xs text-muted-foreground hover:text-foreground"
        >
          {formatDate(filterDate)} · limpar filtro ✕
        </button>
      )}

      {isLoading && <LoadingState />}
      {!isLoading && visiblePosts.length === 0 && (
        <EmptyState message={filterDate ? 'Nenhum post nesse dia.' : 'Nenhum post ainda. Crie o primeiro.'} />
      )}

      <div className="flex flex-col gap-2">
        {visiblePosts.map((post, index) => (
          <Card
            key={post.id}
            className="animate-fade-in-up"
            style={{ '--stagger-index': Math.min(index, 6) } as CSSProperties}
          >
            <CardContent className="flex flex-col gap-2 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="font-display text-[10px] font-semibold tracking-wide uppercase"
                  style={{ color: PLATAFORMA_CORES[post.plataforma] }}
                >
                  {PLATAFORMA_LABELS[post.plataforma]}
                </span>
                <span className="text-[10px] text-muted-foreground">{TIPO_LABELS[post.tipo]}</span>
                {post.data_publicacao && (
                  <span className="text-[10px] text-muted-foreground">{formatDate(post.data_publicacao)}</span>
                )}
                <Select
                  value={post.status}
                  onValueChange={(v) =>
                    updatePost.mutate(
                      { id: post.id, values: { status: v as Tables<'posts'>['status'] } },
                      { onError: () => toast.error('Não consegui atualizar o status') },
                    )
                  }
                >
                  <SelectTrigger size="sm" className="h-6 rounded-full px-2 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{post.titulo}</p>
                  {post.legenda && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{post.legenda}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(post)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      deletePost.mutate(post.id, { onError: () => toast.error('Não consegui excluir esse post') })
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PostFormDialog open={formOpen} onOpenChange={setFormOpen} post={editing} defaultData={filterDate ?? undefined} />
    </div>
  )
}
