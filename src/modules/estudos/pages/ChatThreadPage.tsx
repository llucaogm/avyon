import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingState } from '@/shared/components/common/LoadingState'
import { useConversas, useMensagens, useEnviarMensagem } from '@/modules/estudos/hooks/useChat'
import { useNotas } from '@/modules/estudos/hooks/useNotas'
import { MessageBubble } from '@/modules/estudos/components/chat/MessageBubble'
import { ChatComposer } from '@/modules/estudos/components/chat/ChatComposer'
import { getErrorMessage } from '@/shared/lib/errors'

export default function ChatThreadPage() {
  const { conversaId: conversaIdParam } = useParams<{ conversaId: string }>()
  const conversaId = conversaIdParam && conversaIdParam !== 'nova' ? conversaIdParam : undefined
  const [searchParams] = useSearchParams()
  const notaId = conversaId ? undefined : (searchParams.get('notaId') ?? undefined)
  const navigate = useNavigate()

  const { data: conversas = [] } = useConversas()
  const { data: mensagens = [], isLoading: loadingMensagens } = useMensagens(conversaId)
  const { data: notas = [] } = useNotas()
  const enviarMensagem = useEnviarMensagem()

  const [texto, setTexto] = useState('')
  const prefilledRef = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const conversaAtual = conversas.find((c) => c.id === conversaId)
  const titulo = conversaId ? (conversaAtual?.titulo ?? 'Conversa') : 'Nova conversa'

  useEffect(() => {
    if (prefilledRef.current || !notaId) return
    const nota = notas.find((n) => n.id === notaId)
    if (!nota) return
    prefilledRef.current = true
    setTexto(`${nota.titulo}\n\n${nota.conteudo ?? nota.resumo ?? ''}`.trim())
  }, [notaId, notas])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens.length])

  function handleSend() {
    const mensagem = texto.trim()
    if (!mensagem) return
    enviarMensagem.mutate(
      { conversaId, notaId, mensagem },
      {
        onSuccess: (data) => {
          setTexto('')
          if (!conversaId) navigate(`/estudos/chat/${data.conversaId}`, { replace: true })
        },
        onError: (err) => toast.error(getErrorMessage(err, 'Não consegui enviar essa mensagem')),
      },
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link to="/estudos/chat" aria-label="Voltar">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="font-display truncate text-lg font-semibold">{titulo}</h1>
      </div>

      <div className="flex min-h-[50vh] flex-col overflow-hidden rounded-xl border bg-card">
        <div className="flex max-h-[60vh] flex-1 flex-col gap-3 overflow-y-auto p-4">
          {loadingMensagens && <LoadingState />}
          {!loadingMensagens && mensagens.length === 0 && (
            <p className="m-auto max-w-sm text-center text-sm text-muted-foreground">
              Cole um texto ou pergunte algo. A conversa continua enquanto você quiser.
            </p>
          )}
          {mensagens.map((m) => (
            <MessageBubble key={m.id} mensagem={m} />
          ))}
          {enviarMensagem.isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">Pensando…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <ChatComposer value={texto} onChange={setTexto} onSend={handleSend} pending={enviarMensagem.isPending} />
      </div>
    </div>
  )
}
