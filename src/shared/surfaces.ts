/**
 * Moving the extension's own tabs: focusing a surface that is already open, or
 * opening it when it is not.
 *
 * Both the service worker (bringing the timer forward when the alarm rings) and
 * the UI (the fullscreen control) need this, and both need it to *prefer an open
 * tab over a new one* — so there is a single fullscreen view at a time
 * (AGENTS.md "Full screen").
 *
 * `chrome.runtime.getContexts` reports the extension's own tabs with their
 * `tabId` and `windowId` **without** the `tabs` permission — reading a tab's URL
 * needs that permission, but reading our own contexts does not. Focusing a tab
 * (`chrome.tabs.update`) and raising its window (`chrome.windows.update`) need no
 * permission either.
 */

/** The fullscreen timer surface (AGENTS.md "Full screen"). */
export const FULLSCREEN_PAGE = 'fullscreen.html'

/** The popup, when it is open as a tab. */
export const POPUP_PAGE = 'popup.html'

/** The timer surfaces, most prominent first, when one has to be chosen. */
export const TIMER_PAGES = [FULLSCREEN_PAGE, POPUP_PAGE] as const

/** Whether this context can move the extension's own tabs. */
export function canMoveTabs(): boolean {
    return (
        typeof chrome !== 'undefined' &&
        typeof chrome.runtime?.getContexts === 'function' &&
        typeof chrome.tabs?.update === 'function'
    )
}

interface SurfaceTab {
    tabId: number
    windowId: number
}

/** The first open tab whose document is one of `pages`, if there is one. */
async function findSurfaceTab(pages: readonly string[]): Promise<SurfaceTab | null> {
    const contexts = await chrome.runtime.getContexts({ contextTypes: ['TAB'] })
    for (const page of pages) {
        const url = chrome.runtime.getURL(page)
        const match = contexts.find((context) => context.documentUrl?.startsWith(url) && context.tabId >= 0)
        if (match !== undefined) return { tabId: match.tabId, windowId: match.windowId }
    }
    return null
}

/**
 * Brings `pages` to the front: focuses an open tab (preferring the first page)
 * in whatever window it lives, raising that window too, or opens the first page
 * when none is open. Returns `false` when there is no extension to move tabs in
 * — the browser design preview — so the caller can fall back to `window.open`.
 */
export async function revealSurface(pages: readonly [string, ...string[]]): Promise<boolean> {
    if (!canMoveTabs()) return false

    const existing = await findSurfaceTab(pages)
    if (existing !== null) {
        await chrome.tabs.update(existing.tabId, { active: true })
        if (existing.windowId >= 0 && typeof chrome.windows?.update === 'function') {
            await chrome.windows.update(existing.windowId, { focused: true })
        }
        return true
    }

    await chrome.tabs.create({ url: chrome.runtime.getURL(pages[0]) })
    return true
}
