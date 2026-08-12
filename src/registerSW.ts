import { registerSW } from 'virtual:pwa-register'

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

/** `registerType: 'autoUpdate'` (vite.config.ts) only controls how the *service
 * worker itself* installs — it does NOT skip-waiting or reload the page for you
 * when you hand-roll registration like this (that assumption from an earlier
 * pass here was wrong: a build could sit fully downloaded in "waiting" state
 * indefinitely). `onNeedRefresh` is what actually fires once a new SW is
 * waiting — calling `updateSW(true)` tells it to take over and reloads once it
 * does, with no prompt. The periodic `registration.update()` is what catches
 * new deploys in the first place — browsers otherwise mostly check for a new
 * sw.js only on full navigations. */
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    setInterval(() => registration.update(), UPDATE_CHECK_INTERVAL_MS)
  },
  onNeedRefresh() {
    updateSW(true)
  },
})
