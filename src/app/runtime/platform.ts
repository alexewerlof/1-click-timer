/**
 * Whether the UI is running inside the extension.
 *
 * `npm run dev` serves the same pages from Vite in a plain browser, where the
 * `chrome.*` APIs the real runtimes need are absent — so the seams
 * (`runtime.ts`, `settingsRuntime.ts`) fall back to their in-memory mocks and
 * the design loop keeps working.
 */
export function isExtension(): boolean {
    return (
        typeof chrome !== 'undefined' &&
        typeof chrome.runtime !== 'undefined' &&
        Boolean(chrome.runtime.id) &&
        typeof chrome.storage !== 'undefined'
    )
}
