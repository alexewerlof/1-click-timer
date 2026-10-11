/**
 * In-memory `SettingsStore` for the browser design preview and for tests.
 *
 * The dev singleton is backed by `localStorage` (and listens to the `storage`
 * event) so settings survive a reload and follow across dev tabs; the factory is
 * pure, so tests get isolated instances.
 */

import {
    createSettingsController,
    DEFAULT_SETTINGS,
    normalizeSettings,
    SETTINGS_STORAGE_KEY,
    type SettingsStore,
    type TimerSettings,
} from './settings'

/** A pure, isolated store — no browser storage. */
export function createMockSettings(initial: Partial<TimerSettings> = {}): SettingsStore {
    return createSettingsController({ ...DEFAULT_SETTINGS, ...initial }, () => {})
}

function readStored(): unknown {
    try {
        return JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? 'null')
    } catch {
        return null
    }
}

/** The store the design preview uses: persisted in `localStorage`. */
function createLocalStorageSettings(): SettingsStore {
    const controller = createSettingsController(normalizeSettings(readStored()), (settings) => {
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
        } catch {
            // Storage may be unavailable (private mode); the in-memory value stays.
        }
    })

    window.addEventListener('storage', (event) => {
        if (event.key === SETTINGS_STORAGE_KEY) controller.receive(readStored())
    })

    return controller
}

export const mockSettings: SettingsStore =
    typeof window === 'undefined' ? createMockSettings() : createLocalStorageSettings()
