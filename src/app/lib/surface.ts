/**
 * Which surface the app is rendered in, and how the fullscreen button behaves.
 *
 * The popup and the tab render the same timer; the fullscreen button opens the
 * tab from the popup, and goes fullscreen when already in the tab (AGENTS.md
 * "Full screen"). The settings screen is a third surface of its own (AGENTS.md
 * "Settings"), opened from the face's gear control.
 */

import { openTab } from './links'
import { FULLSCREEN_PAGE, revealSurface } from '../../shared/surfaces'

export type Surface = 'popup' | 'fullscreen' | 'settings'

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
    void revealFullscreen()
}

/**
 * Opens the fullscreen timer in a tab — or, when one is already open, focuses
 * that tab (raising its window) rather than opening a second, so there is a
 * single fullscreen view at a time (AGENTS.md "Full screen").
 */
async function revealFullscreen(): Promise<void> {
    try {
        if (await revealSurface([FULLSCREEN_PAGE])) return
    } catch {
        // No extension, or the tab APIs rejected; fall through to a plain open.
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
