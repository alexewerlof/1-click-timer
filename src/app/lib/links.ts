/**
 * Outbound destinations, and the one way the app opens a tab to them.
 *
 * All three are on the settings screen (AGENTS.md "Settings"), which is the
 * extension's only route out: the author's site, the source code, and the issue
 * tracker. A curious user can find out who is behind the timer, read how it
 * works, and report a bug. (Extension pages are opened separately, through
 * `shared/surfaces.ts`.)
 */

/** The author's site — the settings screen's "About the author" button. */
export const AUTHOR_SITE_URL = 'https://www.alexewerlof.com/'

/** The public repository — the settings screen's "Source code" button. */
export const REPOSITORY_URL = 'https://github.com/alexewerlof/1-click-timer'

/** Where a bug report goes — the settings screen's "Report a bug" button. */
export const ISSUES_URL = 'https://github.com/alexewerlof/1-click-timer/issues'

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
