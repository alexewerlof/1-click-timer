/**
 * Outbound destinations, and the one way the app opens a new tab.
 *
 * The info corner control (MANUAL "Transport") leads to the author's site, so a
 * curious user can find out who is behind the timer — and support the work if
 * they want to.
 */

/** Where the info control leads. */
export const AUTHOR_SITE_URL = 'https://www.alexewerlof.com/'

/**
 * Opens a URL in a new tab. Prefers `chrome.tabs` (the extension context) and
 * falls back to `window.open`, so the same control works in the browser design
 * preview. Creating a tab does not require the `tabs` permission.
 */
export function openTab(url: string): void {
    const api = typeof chrome !== 'undefined' ? chrome : undefined
    if (api?.tabs) {
        void api.tabs.create({ url })
        return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
}
