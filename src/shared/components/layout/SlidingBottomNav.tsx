import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'

export interface SlidingBottomNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

function matches(pathname: string, { to, end }: SlidingBottomNavItem) {
  return end ? pathname === to : pathname.startsWith(to)
}

export function SlidingBottomNav({
  items,
  moreItems = [],
}: {
  items: SlidingBottomNavItem[]
  moreItems?: SlidingBottomNavItem[]
}) {
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const hasMore = moreItems.length > 0
  const slots = items.length + (hasMore ? 1 : 0)
  const moreActive = moreItems.some((item) => matches(pathname, item))
  const activeIndex = moreActive
    ? items.length
    : Math.max(0, items.findIndex((item) => matches(pathname, item)))

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
            width: `calc(100% / ${slots} - 8px)`,
            left: `calc(${activeIndex} * (100% / ${slots}) + 4px)`,
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
          {hasMore && (
            <li className="flex-1">
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className={cn(
                  'press-feedback flex w-full flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground transition-colors',
                  moreActive && 'text-primary',
                )}
              >
                <Menu className="size-5" />
                Mais
              </button>
            </li>
          )}
        </ul>
      </div>

      {hasMore && (
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent side="bottom" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <SheetHeader>
              <SheetTitle>Mais</SheetTitle>
            </SheetHeader>
            <ul className="flex flex-col gap-1 px-2 pb-4">
              {moreItems.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'press-feedback flex items-center gap-3 rounded-md px-3 py-3 text-sm text-foreground transition-colors hover:bg-muted',
                        isActive && 'bg-primary/8 text-primary',
                      )
                    }
                  >
                    <Icon className="size-5" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </SheetContent>
        </Sheet>
      )}
    </nav>
  )
}
