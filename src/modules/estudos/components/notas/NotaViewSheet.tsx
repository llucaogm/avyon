import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { Badge } from '@/shared/components/ui/badge'
import { formatNoteText } from '@/modules/estudos/lib/noteFormat'
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

interface NotaViewSheetProps {
  nota: Tables<'notas'> | null
  materiaNome: string
  onOpenChange: (v: boolean) => void
}

export function NotaViewSheet({ nota, materiaNome, onOpenChange }: NotaViewSheetProps) {
  return (
    <Sheet open={!!nota} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        {nota && (
          <>
            <SheetHeader>
              <SheetTitle>{nota.titulo}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-5 px-4 pb-6">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant="secondary">{TIPO_LABELS[nota.tipo]}</Badge>
                <Badge variant="secondary">{materiaNome}</Badge>
                {nota.fonte && <Badge variant="secondary">{nota.fonte}</Badge>}
                {nota.url && (
                  <a
                    href={nota.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    abrir fonte ↗
                  </a>
                )}
              </div>

              {nota.resumo && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Com minhas palavras
                  </p>
                  <div
                    className="rounded-md bg-muted p-3 text-sm leading-relaxed [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: formatNoteText(nota.resumo) }}
                  />
                </div>
              )}

              {nota.chaves.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Pontos-chave
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {nota.chaves.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {nota.conteudo && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Anotação
                  </p>
                  <div
                    className="text-sm leading-relaxed [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: formatNoteText(nota.conteudo) }}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
