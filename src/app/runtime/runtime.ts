import { mockRuntime } from './mockRuntime'
import type { TimerRuntime } from './types'

/**
 * The runtime the UI talks to — the one line that changes in Phase 3.
 *
 * Phase 1 ships the in-memory mock so popup.html and fullscreen.html also run
 * from `vite dev` in a plain browser, which is what makes the design loop
 * possible. Phase 3 replaces it with the `chrome.storage`-backed runtime.
 */
export const timerRuntime: TimerRuntime = mockRuntime
