import { afterEach, expect, test, vi } from 'vitest'
import { AUTHOR_SITE_URL, openTab } from './links'

/** The two globals `openTab` reaches for, which node does not provide. */
interface TabGlobals {
    chrome?: { tabs: { create: (options: { url: string }) => unknown } }
    window?: { open: (url: string, target: string, features: string) => unknown }
}

const globals = globalThis as unknown as TabGlobals

afterEach(() => {
    delete globals.chrome
    delete globals.window
})

test('opens a tab through the extension where there is one', () => {
    const create = vi.fn()
    globals.chrome = { tabs: { create } }
    const open = vi.fn()
    globals.window = { open }

    openTab(AUTHOR_SITE_URL)

    expect(create).toHaveBeenCalledExactlyOnceWith({ url: AUTHOR_SITE_URL })
    expect(open).not.toHaveBeenCalled()
})

test('falls back to window.open in the browser design preview', () => {
    const open = vi.fn()
    globals.window = { open }

    openTab(AUTHOR_SITE_URL)

    expect(open).toHaveBeenCalledExactlyOnceWith(AUTHOR_SITE_URL, '_blank', 'noopener,noreferrer')
})
