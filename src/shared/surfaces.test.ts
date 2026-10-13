import { afterEach, describe, expect, it, vi } from 'vitest'
import { canMoveTabs, FULLSCREEN_PAGE, POPUP_PAGE, revealSurface } from './surfaces'

interface TabLike {
    tabId: number
    windowId: number
    documentUrl: string
}

/**
 * A minimal `chrome` stub: the four calls `revealSurface` makes, recording what
 * it was asked to do. Node has no `chrome`, so this is the only way to exercise
 * the "focus the open tab" logic — the bug this module exists to fix.
 */
function stubChrome(contexts: TabLike[]) {
    const calls = { activate: [] as unknown[], focusWindow: [] as unknown[], created: [] as unknown[] }
    vi.stubGlobal('chrome', {
        runtime: {
            getURL: (page: string) => `chrome-extension://abc/${page}`,
            getContexts: vi.fn(async () => contexts),
        },
        tabs: {
            update: vi.fn(async (tabId: number, info: unknown) => {
                calls.activate.push([tabId, info])
            }),
            create: vi.fn(async (info: unknown) => {
                calls.created.push(info)
            }),
        },
        windows: {
            update: vi.fn(async (windowId: number, info: unknown) => {
                calls.focusWindow.push([windowId, info])
            }),
        },
    })
    return calls
}

const fullscreen = (tabId: number, windowId: number): TabLike => ({
    tabId,
    windowId,
    documentUrl: 'chrome-extension://abc/fullscreen.html',
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('canMoveTabs', () => {
    it('is false without the extension tab APIs', () => {
        expect(canMoveTabs()).toBe(false)
    })

    it('is true when the extension can move its own tabs', () => {
        stubChrome([])
        expect(canMoveTabs()).toBe(true)
    })
})

describe('revealSurface', () => {
    it('focuses an already-open tab in its own window instead of opening one', async () => {
        const calls = stubChrome([fullscreen(7, 3)])

        expect(await revealSurface([FULLSCREEN_PAGE])).toBe(true)
        expect(calls.activate).toEqual([[7, { active: true }]])
        expect(calls.focusWindow).toEqual([[3, { focused: true }]])
        expect(calls.created).toEqual([])
    })

    it('opens the first page when no such tab is open', async () => {
        const calls = stubChrome([])

        expect(await revealSurface([FULLSCREEN_PAGE])).toBe(true)
        expect(calls.created).toEqual([{ url: 'chrome-extension://abc/fullscreen.html' }])
        expect(calls.activate).toEqual([])
    })

    it('prefers the first page when several are open', async () => {
        const popup: TabLike = { tabId: 2, windowId: 1, documentUrl: 'chrome-extension://abc/popup.html' }
        const calls = stubChrome([popup, fullscreen(9, 4)])

        expect(await revealSurface([FULLSCREEN_PAGE, POPUP_PAGE])).toBe(true)
        expect(calls.activate).toEqual([[9, { active: true }]])
        expect(calls.focusWindow).toEqual([[4, { focused: true }]])
        expect(calls.created).toEqual([])
    })

    it('falls back to the second page when only it is open', async () => {
        const popup: TabLike = { tabId: 2, windowId: 1, documentUrl: 'chrome-extension://abc/popup.html' }
        const calls = stubChrome([popup])

        expect(await revealSurface([FULLSCREEN_PAGE, POPUP_PAGE])).toBe(true)
        expect(calls.activate).toEqual([[2, { active: true }]])
        expect(calls.created).toEqual([])
    })

    it('ignores a context that matches no page', async () => {
        const calls = stubChrome([fullscreen(7, 3), { tabId: 1, windowId: 0, documentUrl: 'https://example.com/' }])

        await revealSurface([FULLSCREEN_PAGE, POPUP_PAGE])
        expect(calls.activate).toEqual([[7, { active: true }]])
    })

    it('reports that it could not act without an extension (design preview)', async () => {
        expect(await revealSurface([FULLSCREEN_PAGE])).toBe(false)
    })
})
