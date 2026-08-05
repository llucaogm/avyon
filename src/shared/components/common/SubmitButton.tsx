import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface SubmitButtonProps {
  pending: boolean
  children: ReactNode
  className?: string
  /** Provide only for dialogs that save via onClick instead of a <form onSubmit>. */
  onClick?: () => void
}

/** Was inconsistent: some dialogs showed a spinner while saving, others didn't. */
export function SubmitButton({ pending, children, className, onClick }: SubmitButtonProps) {
  return (
    <Button type={onClick ? 'button' : 'submit'} onClick={onClick} disabled={pending} className={className}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  )
}
