/**
 * The `SettingsStore` the extension uses.
 *
 * Settings live in `chrome.storage.sync` so they follow the user's profile
 * without an extra permission; if sync is unavailable (signed out, over quota)
 * the write falls back to `chrome.storage.local`, and the read checks local too.
 */

import {
    createSettingsController,
    normalizeSettings,
    SETTINGS_STORAGE_KEY,
    type SettingsStore,
    type TimerSettings,
} from './settings'

async function readArea(area: chrome.storage.StorageArea): Promise<unknown> {
    try {
        const stored = await area.get(SETTINGS_STORAGE_KEY)
        return stored[SETTINGS_STORAGE_KEY]
    } catch {
        return undefined
    }
}

async function persist(settings: TimerSettings): Promise<void> {
    const payload = { [SETTINGS_STORAGE_KEY]: settings }
    try {
        await chrome.storage.sync.set(payload)
    } catch {
        try {
            await chrome.storage.local.set(payload)
        } catch {
            // Both areas failed; the in-memory value is all we have.
        }
    }
}

export function createChromeSettings(): SettingsStore {
    const controller = createSettingsController(normalizeSettings(undefined), (settings) => {
        void persist(settings)
    })

    void (async () => {
        const stored = (await readArea(chrome.storage.sync)) ?? (await readArea(chrome.storage.local))
        controller.receive(stored)
    })()

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'sync' && areaName !== 'local') return
        const change = changes[SETTINGS_STORAGE_KEY]
        if (change) controller.receive(change.newValue)
    })

    return controller
}
