import { useEffect, useState } from 'react'

/** Usado pra alternar entre layouts mobile/desktop (ex: sheet de baixo no
 * celular, dialog centralizado no PC) sem precisar de nenhuma lib nova. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', listener)
    return () => mql.removeEventListener('change', listener)
  }, [query])

  return matches
}
