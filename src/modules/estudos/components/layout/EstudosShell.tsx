import { NavLink, Outlet } from 'react-router-dom'
import { Home, StickyNote, MessageCircle, Network } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { SlidingBottomNav, type SlidingBottomNavItem } from '@/shared/components/layout/SlidingBottomNav'

const estudosNav: SlidingBottomNavItem[] = [
  { to: '/estudos', label: 'Hoje', icon: Home, end: true },
  { to: '/estudos/notas', label: 'Anotações', icon: StickyNote },
  { to: '/estudos/chat', label: 'Chat', icon: MessageCircle },
  { to: '/estudos/mapas', label: 'Mapas', icon: Network },
]

export function EstudosShell() {
  return (
    <div className="md:flex">
      <aside className="hidden w-56 shrink-0 flex-col border-r p-4 md:flex">
        <nav className="flex flex-1 flex-col gap-1">
          {estudosNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'press-feedback flex items-center gap-2 rounded-md border-l-2 border-l-transparent py-2 pr-2 pl-[6px] text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  isActive && 'border-l-primary bg-primary/8 text-primary hover:bg-primary/8 hover:text-primary',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <main className="flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-8 md:pt-6">
          <div className="mx-auto w-full max-w-4xl">
            <Outlet />
          </div>
        </main>

        <SlidingBottomNav items={estudosNav} />
      </div>
    </div>
  )
}
