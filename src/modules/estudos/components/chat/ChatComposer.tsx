import type { KeyboardEvent } from 'react'
import { SendHorizontal } from 'lucide-react'
import { Textarea } from '@/shared/components/ui/textarea'
import { Button } from '@/shared/components/ui/button'

interface ChatComposerProps {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  pending: boolean
  placeholder?: string
}

export function ChatComposer({ value, onChange, onSend, pending, placeholder }: ChatComposerProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !pending) onSend()
    }
  }

  return (
    <div className="flex items-end gap-2 border-t bg-background p-3">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Cole um texto ou pergunte algo… (Enter envia, Shift+Enter quebra linha)'}
        rows={2}
        className="min-h-0 flex-1 resize-none"
        disabled={pending}
      />
      <Button
        size="icon"
        onClick={onSend}
        disabled={pending || !value.trim()}
        aria-label="Enviar mensagem"
      >
        <SendHorizontal className="size-4" />
      </Button>
    </div>
  )
}
