/**
 * Which surface the app is rendered in, and how the fullscreen button behaves.
 *
 * The popup and the tab render the same app; the fullscreen button opens the
 * tab from the popup, and goes fullscreen when already in the tab (MANUAL
 * "Full screen").
 */

import { openTab } from './links'

export type Surface = 'popup' | 'fullscreen'

/** Set on `<html>` by each HTML entry (see `src/popup.html`, `src/fullscreen.html`). */
export const SURFACE_ATTRIBUTE = 'data-surface'

export const FULLSCREEN_PAGE = 'fullscreen.html'

export function readSurface(): Surface {
    const value = document.documentElement.dataset.surface
    return value === 'popup' ? 'popup' : 'fullscreen'
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
