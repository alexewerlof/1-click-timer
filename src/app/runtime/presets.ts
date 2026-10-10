import type { TimerPreset } from './types'

/**
 * Factory defaults (see MANUAL "Set a pre-configured timer").
 * Phase 3 makes these editable and stores them in `chrome.storage.sync`.
 */
export const DEFAULT_PRESETS: readonly TimerPreset[] = [
    { id: 'preset-5', label: '5m', minutes: 5 },
    { id: 'preset-10', label: '10m', minutes: 10 },
    { id: 'preset-30', label: '30m', minutes: 30 },
]
