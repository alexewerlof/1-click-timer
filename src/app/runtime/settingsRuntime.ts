import { createChromeSettings } from './chromeSettings'
import { mockSettings } from './mockSettings'
import { isExtension } from './platform'
import type { SettingsStore } from './settings'

/**
 * The settings the app talks to — the one line that swaps the mock for the
 * `chrome.storage` implementation, mirroring `runtime.ts`.
 */
export const settingsStore: SettingsStore = isExtension() ? createChromeSettings() : mockSettings
