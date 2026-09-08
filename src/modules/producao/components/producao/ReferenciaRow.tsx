import { useEffect, useState, type CSSProperties } from 'react'
import { Play } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { formatHandle } from '@/modules/producao/lib/referenciaFormat'
import { formatShortDate } from '@/shared/lib/formatters'
import type { Tables } from '@/shared/types/database.types'

export function ReferenciaRow({
  referencia: r,
  index,
  onClick,
}: {
  referencia: Tables<'referencias'>
  index: number
  onClick: () => void
}) {
  const [imgError, setImgError] = useState(false)

  // Muitos CDNs de vídeo bloqueiam hotlink direto (referrer/CORS) mesmo pra uma
  // URL de oEmbed "pública" — sem isso, uma imagem que falha renderiza vazia,
  // deixando só o fundo escuro por trás em vez do card colorido de fallback.
  useEffect(() => {
    setImgError(false)
  }, [r.thumbnail_url])

  const showImage = !!r.thumbnail_url && !imgError

  return (
    <button
      type="button"
      onClick={onClick}
      className="animate-fade-in-up press-feedback flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors hover:bg-muted/40"
      style={{ '--stagger-index': Math.min(index, 8) } as CSSProperties}
    >
      <div className="relative aspect-[9/16] w-12 shrink-0 overflow-hidden rounded-lg">
        {showImage ? (
          <img
            src={r.thumbnail_url!}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: r.cor }}>
            <Play className="size-4 text-white/70" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {r.autor && <span className="truncate">{formatHandle(r.autor)}</span>}
          <span className="shrink-0">{formatShortDate(r.created_at)}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm font-medium">{r.titulo}</p>
        {r.tipo && (
          <Badge variant="secondary" className="mt-1.5">
            {r.tipo}
          </Badge>
        )}
      </div>
    </button>
  )
}
