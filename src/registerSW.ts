import { registerSW } from 'virtual:pwa-register'

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

/** `immediate: true` + `registerType: 'autoUpdate'` (vite.config.ts) means a new
 * service worker takes over and reloads the page with no user action needed.
 * The periodic `registration.update()` is what actually catches new deploys —
 * browsers otherwise mostly check for a new sw.js only on full navigations. */
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    setInterval(() => registration.update(), UPDATE_CHECK_INTERVAL_MS)
  },
})
