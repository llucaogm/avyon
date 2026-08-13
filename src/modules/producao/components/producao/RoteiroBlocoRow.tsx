import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Button } from '@/shared/components/ui/button'
import type { RoteiroBloco } from '@/modules/producao/lib/roteiroBlocos'

interface RoteiroBlocoRowProps {
  bloco: RoteiroBloco
  onChange: (bloco: RoteiroBloco) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
}

export function RoteiroBlocoRow({
  bloco,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: RoteiroBlocoRowProps) {
  return (
    <div className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-[140px_90px_1fr_1fr_auto] sm:items-start">
      <div>
        <p className="mb-1 text-[10px] text-muted-foreground sm:hidden">Bloco</p>
        <Input
          value={bloco.nome}
          onChange={(e) => onChange({ ...bloco, nome: e.target.value })}
          placeholder="Nome do bloco"
          className="font-medium"
        />
      </div>
      <div>
        <p className="mb-1 text-[10px] text-muted-foreground sm:hidden">Tempo</p>
        <Input
          value={bloco.tempo}
          onChange={(e) => onChange({ ...bloco, tempo: e.target.value })}
          placeholder="0:00-0:05"
        />
      </div>
      <div>
        <p className="mb-1 text-[10px] text-muted-foreground sm:hidden">Fala / Texto</p>
        <Textarea
          value={bloco.fala}
          onChange={(e) => onChange({ ...bloco, fala: e.target.value })}
          placeholder="O que é dito ou escrito na tela..."
          rows={2}
        />
      </div>
      <div>
        <p className="mb-1 text-[10px] text-muted-foreground sm:hidden">Visual / Ação</p>
        <Textarea
          value={bloco.visual}
          onChange={(e) => onChange({ ...bloco, visual: e.target.value })}
          placeholder="O que aparece na tela..."
          rows={2}
        />
      </div>
      <div className="flex flex-row gap-1 sm:flex-col">
        <Button variant="ghost" size="icon-sm" onClick={onMoveUp} disabled={!canMoveUp} aria-label="Mover pra cima">
          <ChevronUp className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onMoveDown} disabled={!canMoveDown} aria-label="Mover pra baixo">
          <ChevronDown className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={onRemove} aria-label="Remover bloco">
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
