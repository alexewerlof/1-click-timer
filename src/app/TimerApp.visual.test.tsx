import { page } from 'vitest/browser'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import type { ReactElement } from 'react'
import { TimerApp } from './TimerApp'
import './design/global.css'
import { createMockRuntime } from './runtime/mockRuntime'
import type { TimerStatus } from './runtime/types'

/** The popup panel size from `design/global.css`. */
const POPUP_WIDTH = 380
const POPUP_HEIGHT = 420

/**
 * The face is the one thing that must be judged visually, so each state gets a
 * reference screenshot. Runs in a real browser (`npm run test:visual`), which
 * is also what makes CSS Modules and SVG rendering part of the test.
 */
const STATES: readonly TimerStatus[] = ['idle', 'running', 'paused', 'expired']

function stage(children: ReactElement): ReactElement {
    return <div style={{ width: POPUP_WIDTH, height: POPUP_HEIGHT }}>{children}</div>
}

for (const status of STATES) {
    test(`renders the ${status} face`, async () => {
        const runtime = createMockRuntime()
        // Parked, not ticking, so the screenshot is deterministic.
        runtime.forceStatus(status)

        const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

        await expect.element(screen.getByRole('slider')).toBeVisible()
        await expect.element(screen.getByRole('button', { name: '5m' })).toBeVisible()
        await expect(page.elementLocator(screen.container)).toMatchScreenshot(`classic-${status}`)
    })
}

/**
 * The readout overflowing its disc has regressed twice, so it is asserted here
 * rather than left to the eye. Measured in a real browser, which is the only
 * place the text's actual box is knowable.
 */
test('keeps the readout inside the readout disc', async () => {
    const runtime = createMockRuntime()
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    const text = svg.querySelector('text[class*="readout"]') as SVGTextElement
    const disc = svg.querySelector('circle[class*="readoutDisc"]') as SVGCircleElement

    const box = text.getBBox()
    const centreX = Number(disc.getAttribute('cx'))
    const centreY = Number(disc.getAttribute('cy'))
    const radius = Number(disc.getAttribute('r'))

    // Worst case: the text box centre is offset from the disc centre, so add the
    // offset to the half-diagonal before comparing against the radius.
    const offset = Math.hypot(box.x + box.width / 2 - centreX, box.y + box.height / 2 - centreY)
    const halfDiagonal = Math.hypot(box.width / 2, box.height / 2)

    expect(text.textContent).toBe('0:00')
    expect(offset + halfDiagonal).toBeLessThanOrEqual(radius)
})
