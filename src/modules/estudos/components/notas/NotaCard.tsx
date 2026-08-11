import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { studyColorVar } from '@/modules/estudos/lib/studyColors'
import { cn } from '@/shared/lib/utils'
import type { Tables } from '@/shared/types/database.types'

const TIPO_LABELS: Record<Tables<'notas'>['tipo'], string> = {
  rascunho: 'Rascunho',
  livro: 'Livro',
  artigo: 'Artigo',
  video: 'Vídeo',
  aula: 'Aula',
  podcast: 'Podcast',
  ideia: 'Ideia',
}

interface NotaCardProps {
  nota: Tables<'notas'>
  materiaNome: string
  onLer: () => void
  onEditar: () => void
  onExcluir: () => void
  selecionavel?: boolean
  selecionado?: boolean
  onToggleSelecionado?: () => void
}

export function NotaCard({
  nota,
  materiaNome,
  onLer,
  onEditar,
  onExcluir,
  selecionavel,
  selecionado,
  onToggleSelecionado,
}: NotaCardProps) {
  const previa = nota.resumo || nota.conteudo || nota.chaves.join(' · ') || 'Sem conteúdo ainda.'

  return (
    <Card
      className={cn(
        'animate-fade-in-up relative flex flex-col overflow-hidden py-0 transition-colors',
        selecionavel && 'cursor-pointer',
        selecionado && 'ring-2 ring-primary',
      )}
      onClick={selecionavel ? onToggleSelecionado : undefined}
    >
      <div className="h-1.5" style={{ backgroundColor: studyColorVar(nota.cor) }} />
      {selecionavel && (
        <Checkbox
          checked={!!selecionado}
          onCheckedChange={onToggleSelecionado}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 right-3 bg-card"
          aria-label={`Selecionar ${nota.titulo}`}
        />
      )}
      <CardContent className="flex flex-1 flex-col gap-2 py-4">
        <h3 className="font-display pr-6 text-base font-semibold leading-tight">{nota.titulo}</h3>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Badge variant="secondary">{TIPO_LABELS[nota.tipo]}</Badge>
          <span>{materiaNome}</span>
          {nota.fonte && <span>· {nota.fonte}</span>}
        </div>
        <p className="line-clamp-4 text-sm text-muted-foreground">{previa}</p>
        {nota.chaves.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {nota.chaves.length} ponto{nota.chaves.length > 1 ? 's' : ''}-chave
          </p>
        )}
      </CardContent>
      {!selecionavel && (
        <div className="flex gap-1 border-t p-2">
          <Button variant="ghost" size="sm" onClick={onLer}>
            Ler
          </Button>
          <Button variant="ghost" size="sm" onClick={onEditar}>
            Editar
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive ml-auto" onClick={onExcluir}>
            Excluir
          </Button>
        </div>
      )}
    </Card>
  )
}
