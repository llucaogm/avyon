import { NavLink, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export interface SlidingBottomNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export function SlidingBottomNav({ items }: { items: SlidingBottomNavItem[] }) {
  const { pathname } = useLocation()
  const activeIndex = Math.max(
    0,
    items.findIndex(({ to, end }) => (end ? pathname === to : pathname.startsWith(to))),
  )

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative">
        <span
          aria-hidden
          className="bg-gradient-brand absolute top-1.5 h-9 rounded-full opacity-15 transition-[left] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            width: `calc(100% / ${items.length} - 8px)`,
            left: `calc(${activeIndex} * (100% / ${items.length}) + 4px)`,
          }}
        />
        <ul className="relative flex items-stretch justify-between">
          {items.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'press-feedback flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground transition-colors',
                    isActive && 'text-primary',
                  )
                }
              >
                <Icon className="size-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
