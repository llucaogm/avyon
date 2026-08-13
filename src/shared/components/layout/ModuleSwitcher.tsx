import { NavLink } from 'react-router-dom'
import { Wallet, ListChecks, GraduationCap, Clapperboard } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const MODULES = [
  { to: '/financeiro', label: 'Financeiro', icon: Wallet },
  { to: '/habitos', label: 'Hábitos', icon: ListChecks },
  { to: '/estudos', label: 'Estudos', icon: GraduationCap },
  { to: '/producao', label: 'Produção', icon: Clapperboard },
]

export function ModuleSwitcher() {
  return (
    <div className="bg-muted flex items-center gap-1 rounded-full p-1">
      {MODULES.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'press-feedback flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors',
              isActive && 'bg-gradient-brand text-primary-foreground',
            )
          }
        >
          <Icon className="size-4" />
          <span className="hidden sm:inline">{label}</span>
        </NavLink>
      ))}
    </div>
  )
}
