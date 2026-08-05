import { useMemo, useRef } from 'react'
import { useAuth } from '@/shared/context/AuthProvider'
import { logger, type LogContext } from '@/shared/lib/logger'

type CallerContext = Omit<LogContext, 'action' | 'userId' | 'requestId'> & { requestId?: string | number }

/**
 * For call sites outside React Query's mutation system (auth calls, sign-out),
 * where the global MutationCache logger in queryClient.ts can't reach.
 * Binds userId + a per-mount requestId automatically so callers only pass
 * `action` and whatever extra context is relevant.
 */
export function useLogger() {
  const { user } = useAuth()
  const requestIdRef = useRef(0)

  return useMemo(() => {
    const bind =
      (level: 'info' | 'warn' | 'error' | 'fatal') =>
      (action: string, context: CallerContext = {}, error?: unknown) => {
        requestIdRef.current += 1
        const fullContext: LogContext = {
          action,
          userId: user?.id,
          requestId: context.requestId ?? `${action}-${requestIdRef.current}`,
          ...context,
        }
        if (level === 'info') logger.info(action, fullContext)
        else logger[level](action, fullContext, error)
      }

    return {
      info: bind('info'),
      warn: bind('warn'),
      error: bind('error'),
      fatal: bind('fatal'),
    }
  }, [user?.id])
}
