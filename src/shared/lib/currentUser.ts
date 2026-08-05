/**
 * Tiny side-channel holding the signed-in user id outside the React tree.
 * Needed because the global mutation-cache error handler (queryClient.ts) runs
 * outside any component, but still needs to tag every log line with who was
 * signed in when the failure happened.
 */
let currentUserId: string | undefined

export function setCurrentUserId(id: string | undefined) {
  currentUserId = id
}

export function getCurrentUserId(): string | undefined {
  return currentUserId
}
