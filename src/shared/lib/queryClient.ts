import { QueryClient, MutationCache } from '@tanstack/react-query'
import { logger } from '@/shared/lib/logger'
import { getCurrentUserId } from '@/shared/lib/currentUser'

export const queryClient = new QueryClient({
  // Central safety net: every mutation failure gets a structured log line —
  // action + userId + a correlation id — even if the component that fired it
  // never checks the error. Toasts/UX stay local to each call site; this is
  // only the observability guarantee.
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      const action =
        (mutation.options.meta?.action as string | undefined) ??
        mutation.options.mutationKey?.join('.') ??
        'unknown_mutation'

      logger.error(
        `Mutation failed: ${action}`,
        {
          action,
          userId: getCurrentUserId(),
          requestId: mutation.mutationId,
        },
        error,
      )
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    },
  },
})
