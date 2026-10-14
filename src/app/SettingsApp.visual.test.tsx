import { page } from 'vitest/browser'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { SettingsApp } from './SettingsApp'
import './design/global.css'
import { createMockSettings } from './runtime/mockSettings'

/**
 * The settings screen in a real browser. `global.css` and the CSS Modules only
 * take effect here, which is where the focus ring and the swatch selection ring
 * interact — a cascade problem that a node test cannot see.
 */

/**
 * Clicking a swatch leaves that button focused, and a mouse click is not
 * `:focus-visible`. The selection ring is drawn with `outline`, and `global.css`
 * cancels the UA focus ring with `:where(:focus:not(:focus-visible)) { outline:
 * none }` — a reset that must not out-specify the swatch's own outline, or the
 * ring vanishes for as long as the swatch keeps focus after the click (and only
 * returns once it is blurred). The `:where()` keeps the reset at zero
 * specificity so the selection ring survives.
 */
test('keeps the selected swatch’s ring while it holds focus after a click', async () => {
    const screen = await render(<SettingsApp settingsStore={createMockSettings()} />)

    const conic = screen.getByRole('radio', { name: 'Conic' }).element() as HTMLButtonElement
    await page.elementLocator(conic).click()

    // A real click focuses the button, but not `:focus-visible`.
    expect(document.activeElement).toBe(conic)
    expect(conic.matches(':focus-visible')).toBe(false)
    // The selection ring is still painted — the focus reset did not erase it.
    expect(getComputedStyle(conic).outlineStyle).toBe('solid')
})
