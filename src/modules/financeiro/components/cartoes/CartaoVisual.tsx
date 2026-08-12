import { useId } from 'react'
import { pickCardTextColor } from '@/modules/financeiro/lib/cardColor'

/** 4 dígitos falsos, estáveis por cartão (derivados do id) — só pra imitar o
 * visual de um cartão físico, não representam número real nenhum. */
function pseudoDigits(id: string): string {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return String(hash % 10000).padStart(4, '0')
}

function ChipIcon({ gradientId }: { gradientId: string }) {
  return (
    <svg viewBox="0 0 34 26" fill="none" aria-hidden="true" className="h-auto w-[16%] min-w-6 drop-shadow-sm">
      <rect x="0.5" y="0.5" width="33" height="25" rx="4" fill={`url(#${gradientId})`} stroke="rgba(0,0,0,0.25)" />
      <g stroke="rgba(0,0,0,0.25)" strokeWidth="0.75">
        <line x1="11.3" y1="0.5" x2="11.3" y2="25.5" />
        <line x1="22.6" y1="0.5" x2="22.6" y2="25.5" />
        <line x1="0.5" y1="8.5" x2="33.5" y2="8.5" />
        <line x1="0.5" y1="17.5" x2="33.5" y2="17.5" />
      </g>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="34" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F3D98B" />
          <stop offset="1" stopColor="#C9A24B" />
        </linearGradient>
      </defs>
    </svg>
  )
}

interface CartaoVisualProps {
  cartao: { id: string; nome: string; cor: string; tipo: 'debito' | 'credito' }
  className?: string
}

/** Mockup de cartão físico — chip + nome em tipografia própria da Avyon, não
 * o logo oficial de nenhum banco (ver bancoPresets.ts). Escala via container
 * query (containerType abaixo) pra funcionar tanto num tile pequeno do
 * seletor de banco quanto na grade grande de Cartões. */
export function CartaoVisual({ cartao, className }: CartaoVisualProps) {
  const gradientId = useId()
  const textColor = pickCardTextColor(cartao.cor)
  const digits = pseudoDigits(cartao.id)

  return (
    <div
      className={`bank-card aspect-[85.6/54] w-full rounded-2xl p-[6%] shadow-lg ${className ?? ''}`}
      style={{
        containerType: 'inline-size',
        background: `linear-gradient(135deg, ${cartao.cor}, color-mix(in oklab, ${cartao.cor} 100%, black 35%))`,
        color: textColor,
      }}
    >
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <ChipIcon gradientId={gradientId} />
          <span
            className="font-display truncate text-right leading-none font-bold uppercase"
            style={{ fontSize: 'clamp(9px, 8cqw, 20px)' }}
          >
            {cartao.nome}
          </span>
        </div>
        <p className="truncate leading-none opacity-90" style={{ fontSize: 'clamp(8px, 6cqw, 16px)', letterSpacing: '0.15em' }}>
          •••• •••• •••• {digits}
        </p>
        <span
          className="font-medium uppercase opacity-80"
          style={{ fontSize: 'clamp(6px, 3.2cqw, 10px)', letterSpacing: '0.15em' }}
        >
          {cartao.tipo === 'credito' ? 'Crédito' : 'Débito'}
        </span>
      </div>
    </div>
  )
}
