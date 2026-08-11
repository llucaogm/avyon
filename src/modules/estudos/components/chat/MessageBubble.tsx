import { formatNoteText } from '@/modules/estudos/lib/noteFormat'
import { cn } from '@/shared/lib/utils'
import type { Tables } from '@/shared/types/database.types'

export function MessageBubble({ mensagem }: { mensagem: Tables<'mensagens'> }) {
  const isUser = mensagem.role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[75%]',
          isUser
            ? 'bg-gradient-brand text-primary-foreground'
            : 'bg-muted text-foreground [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{mensagem.conteudo}</p>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: formatNoteText(mensagem.conteudo) }} />
        )}
      </div>
    </div>
  )
}
