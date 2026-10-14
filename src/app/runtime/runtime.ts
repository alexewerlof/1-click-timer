import { createChromeRuntime } from './chromeRuntime'
import { mockRuntime } from './mockRuntime'
import { isExtension } from './platform'
import type { TimerRuntime } from './types'

/**
 * The runtime the UI talks to.
 *
 * The extension gets the `chrome.storage`-backed runtime, where the service
 * worker owns the timer. A plain browser (the `vite dev` design loop) gets the
 * in-memory mock, because the `chrome.*` APIs it needs are absent there. The
 * chrome runtime is built lazily, so importing this module in a plain browser
 * never touches `chrome.storage`.
 */
export const timerRuntime: TimerRuntime = isExtension() ? createChromeRuntime() : mockRuntime
