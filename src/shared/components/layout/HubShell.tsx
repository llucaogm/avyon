import { Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/shared/lib/supabaseClient'
import { useLogger } from '@/shared/hooks/useLogger'
import { ModuleSwitcher } from '@/shared/components/layout/ModuleSwitcher'
import { Button } from '@/shared/components/ui/button'

export function HubShell() {
  const log = useLogger()

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      log.error('auth.sign_out', {}, error)
      toast.error('Não consegui sair da conta. Tente novamente.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-brand flex size-7 items-center justify-center rounded-full">
            <span className="text-primary-foreground font-display text-xs font-bold">A</span>
          </div>
          <span className="text-gradient-brand font-display hidden text-sm font-semibold sm:inline">
            Avyon
          </span>
        </div>

        <ModuleSwitcher />

        <Button
          variant="ghost"
          size="icon"
          aria-label="Sair"
          className="press-feedback text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
        </Button>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}
