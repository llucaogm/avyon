import type { ReactNode } from 'react'
import { useInView } from '@/shared/hooks/useInView'
import { cn } from '@/shared/lib/utils'

interface RevealProps {
  children: ReactNode
  className?: string
  /** ms, staggers a group of Reveal siblings without needing a shared parent index. */
  delay?: number
}

/** Fades a section up as it scrolls into view (once), instead of animating
 * everything on mount regardless of scroll position. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={cn(
        'transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
        inView ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
        className,
      )}
      style={{ transitionDelay: inView ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}
