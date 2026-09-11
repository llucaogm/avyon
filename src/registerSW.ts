import { registerSW } from 'virtual:pwa-register'

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

/** `registerType: 'autoUpdate'` (vite.config.ts) only controls how the *service
 * worker itself* installs — it does NOT skip-waiting or reload the page for you
 * when you hand-roll registration like this. `onNeedRefresh` fires once a new
 * SW enters the "waiting" state *during this page's session* — calling
 * `updateSW(true)` tells it to take over and reloads once it does, with no
 * prompt. But if a deploy already put a worker into "waiting" *before* this
 * page's listeners attached (e.g. it was left waiting from an earlier visit),
 * the "waiting" event already fired and `onNeedRefresh` never triggers for it —
 * the page is then stuck on the stale build indefinitely. `onRegisteredSW`
 * checking `registration.waiting` up front catches exactly that case. The
 * periodic `registration.update()` plus the `visibilitychange` check are what
 * catch new deploys in the first place — browsers otherwise mostly check for a
 * new sw.js only on full navigations. */
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    if (registration.waiting) updateSW(true)
    setInterval(() => registration.update(), UPDATE_CHECK_INTERVAL_MS)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update()
    })
  },
  onNeedRefresh() {
    updateSW(true)
  },
})
