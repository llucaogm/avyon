import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { studyColorVar } from '@/modules/estudos/lib/studyColors'
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
}

export function NotaCard({ nota, materiaNome, onLer, onEditar, onExcluir }: NotaCardProps) {
  const previa = nota.resumo || nota.conteudo || nota.chaves.join(' · ') || 'Sem conteúdo ainda.'

  return (
    <Card className="animate-fade-in-up flex flex-col overflow-hidden py-0">
      <div className="h-1.5" style={{ backgroundColor: studyColorVar(nota.cor) }} />
      <CardContent className="flex flex-1 flex-col gap-2 py-4">
        <h3 className="font-display text-base font-semibold leading-tight">{nota.titulo}</h3>
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
    </Card>
  )
}
