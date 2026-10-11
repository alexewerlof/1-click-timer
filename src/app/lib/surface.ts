/**
 * Which surface the app is rendered in, and how the fullscreen button behaves.
 *
 * The popup and the tab render the same timer; the fullscreen button opens the
 * tab from the popup, and goes fullscreen when already in the tab (AGENTS.md
 * "Full screen"). The settings screen is a third surface of its own (AGENTS.md
 * "Settings"), opened from the face's gear control.
 */

import { openTab } from './links'

export type Surface = 'popup' | 'fullscreen' | 'settings'

const FULLSCREEN_PAGE = 'fullscreen.html'
const SETTINGS_PAGE = 'settings.html'

export function readSurface(): Surface {
    const value = document.documentElement.dataset.surface
    if (value === 'popup' || value === 'settings') return value
    return 'fullscreen'
}

/** Opens the settings screen in a new tab (AGENTS.md "Settings"). */
export function openSettings(): void {
    openExtensionTab(SETTINGS_PAGE)
}

export function toggleFullscreenSurface(surface: Surface): void {
    if (surface === 'fullscreen') {
        void toggleDocumentFullscreen()
        return
    }
    openExtensionTab(FULLSCREEN_PAGE)
}

async function toggleDocumentFullscreen(): Promise<void> {
    if (document.fullscreenElement) return document.exitFullscreen()
    return document.documentElement.requestFullscreen()
}

/** The page as an extension URL when there is an extension to resolve it against. */
function openExtensionTab(page: string): void {
    const api = typeof chrome !== 'undefined' ? chrome : undefined
    openTab(api ? api.runtime.getURL(page) : page)
}
