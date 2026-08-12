import { useEffect, useRef, useState } from 'react'

/** True once the element has scrolled into view — stays true afterwards (no
 * re-trigger scrolling back up), so a card doesn't replay its entrance. */
export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px', ...options },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [inView, options])

  return { ref, inView }
}
