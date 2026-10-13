import { page } from 'vitest/browser'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import type { ReactElement } from 'react'
import { TimerApp } from './TimerApp'
import {
    DIAL_TICKS,
    DIAL_VIEWBOX_WIDTH,
    DISC_RADIUS,
    MINUTES_PER_TURN,
    NUMERAL_MINUTES,
    NUMERAL_RADIUS,
    pointOnDial,
} from './lib/dial'
import './design/global.css'
import { SECONDS_PER_MINUTE } from './lib/time'
import { createMockRuntime } from './runtime/mockRuntime'
import type { TimerStatus } from './runtime/types'

/** The square popup panel size from `design/global.css`. */
const POPUP_WIDTH = 380
const POPUP_HEIGHT = 380

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
    // Parked at a running timer: the readout is blank while idle, so there would
    // be no text box to measure.
    runtime.forceStatus('running')
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

    expect(text.textContent).toBe('12:30')
    expect(offset + halfDiagonal).toBeLessThanOrEqual(radius)
})

/**
 * An idle timer has no remaining time to report, so the readout stays blank
 * instead of standing at `0:00`. The disc itself stays, so the centre keeps the
 * layer it reads as.
 */
test('leaves the readout blank while the timer is idle', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('idle')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement

    expect(svg.querySelector('text[class*="readout"]')).toBeNull()
    expect(svg.querySelector('circle[class*="readoutDisc"]')).not.toBeNull()
})

/**
 * The preview arc regressed at a whole turn: `remainingArcPath` returns '' when
 * the arc would close on itself, so the sliver of dial just clockwise of 12
 * o'clock previewed nothing — even though a click there starts the whole turn.
 * The preview has to be driven through the DOM because the minute comes from
 * the pointer's position in the SVG's own coordinate space.
 */
test('previews a full circle at a whole turn', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('idle')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    // The point a hair clockwise of 12 o'clock, whose minute rounds up to 60.
    // Slightly inside the rim so rounding through the screen matrix cannot land
    // it a hair outside the disc.
    const onDisc = pointOnDial(MINUTES_PER_TURN - 0.1, DISC_RADIUS - 1)
    const matrix = svg.getScreenCTM()
    if (!matrix) throw new Error('the slider has no screen CTM')
    const at = new DOMPoint(onDisc.x, onDisc.y).matrixTransform(matrix)

    svg.dispatchEvent(new PointerEvent('pointermove', { clientX: at.x, clientY: at.y, bubbles: true }))

    // Polled, because React flushes a pointermove update asynchronously.
    const preview = await vi.waitFor(() => {
        const circle = svg.querySelector('circle[class*="previewArc"]')
        if (!circle) throw new Error('the whole turn has not previewed a full circle yet')
        return circle
    })
    await expect.element(page.elementLocator(preview)).toBeVisible()
})

/**
 * The previewed minute used to appear in the readout. Now it is drawn as a
 * numeral on the numeral ring, at the end of the arc, and the whole ring steps
 * aside so it is the only number on the face (AGENTS.md "Preview numeral"). The
 * readout keeps showing the remaining time — nothing, while idle.
 */
test('draws the previewed minute as the only numeral on the face', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('idle')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    // Exactly on the 15-minute mark, slightly inside the rim so rounding through
    // the screen matrix cannot land the point off the disc.
    const onDisc = pointOnDial(15, DISC_RADIUS - 2)
    const matrix = svg.getScreenCTM()
    if (!matrix) throw new Error('the slider has no screen CTM')
    const at = new DOMPoint(onDisc.x, onDisc.y).matrixTransform(matrix)

    svg.dispatchEvent(new PointerEvent('pointermove', { clientX: at.x, clientY: at.y, bubbles: true }))

    const numeral = await vi.waitFor(() => {
        const numerals = svg.querySelectorAll('text[class*="numeral"]')
        const only = numerals.length === 1 ? numerals[0] : undefined
        if (!only) throw new Error('the numeral ring has not stepped aside yet')
        return only
    })

    expect(numeral.textContent).toBe('15')
    // It takes the 15 numeral's own place on the ring, so it reads as that numeral.
    const expected = pointOnDial(15, NUMERAL_RADIUS)
    expect(Number(numeral.getAttribute('x'))).toBeCloseTo(expected.x, 3)
    expect(Number(numeral.getAttribute('y'))).toBeCloseTo(expected.y, 3)

    // It wears the remaining sector's colour — the shared `--remaining` token —
    // rather than the numerals' ink. The arc reads the same token, so comparing
    // the two keeps them from drifting apart.
    const arc = svg.querySelector('[class*="previewArc"]') as SVGPathElement
    const remaining = getComputedStyle(arc).stroke
    expect(getComputedStyle(numeral).fill).toBe(remaining)

    // The ticks the arc covers are redrawn in that colour too — and only those.
    // The span is closed, so it runs through the 15-minute tick inclusive.
    const previewTicks = Array.from(svg.querySelectorAll('line[class*="tickPreview"]'))
    expect(previewTicks).toHaveLength(16)
    for (const tick of previewTicks) expect(getComputedStyle(tick).stroke).toBe(remaining)

    const dialTicks = Array.from(svg.querySelectorAll('line')).filter(
        (line) => !(line.getAttribute('class') ?? '').includes('tickPreview'),
    )
    expect(dialTicks).toHaveLength(DIAL_TICKS.length)
    for (const tick of dialTicks) expect(getComputedStyle(tick).stroke).not.toBe(remaining)

    // The readout never previews the minute; while idle it is blank, because
    // there is no remaining time to report.
    expect(svg.querySelector('text[class*="readout"]')).toBeNull()
})

/** The numeral for `minutes`, or a clear failure if the ring does not have one. */
function numeralElement(svg: SVGSVGElement, minutes: number): SVGTextElement {
    const numeral = svg.querySelector(`text[data-numeral-minutes="${minutes}"]`)
    if (!numeral) throw new Error(`the numeral ring has no ${minutes} numeral`)
    return numeral as SVGTextElement
}

/**
 * A numeral is a one-click shortcut to its own duration (AGENTS.md "Set a custom
 * timer"). Clicked through the browser at the middle of the glyphs — over the
 * gap between the digits of "55" — to prove the whole numeral is a hit target
 * and not just the painted glyphs.
 */
test('starts a timer for the clicked numeral', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('idle')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    await page.elementLocator(numeralElement(svg, 55)).click()

    expect(runtime.getState().status).toBe('running')
    expect(runtime.getState().durationSeconds).toBe(55 * SECONDS_PER_MINUTE)
    runtime.reset()
})

/**
 * The 0 numeral marks a whole turn — it sits where the preview numeral shows 60
 * — so clicking it starts 60 minutes rather than the nothing a 0-minute timer
 * would be.
 */
test('starts 60 minutes from the 0 numeral', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('idle')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    await page.elementLocator(numeralElement(svg, 0)).click()

    expect(runtime.getState().status).toBe('running')
    expect(runtime.getState().durationSeconds).toBe(60 * SECONDS_PER_MINUTE)
    runtime.reset()
})

/**
 * A numeral is interactive, so hovering one recolours it to the remaining
 * sector's colour — the same signal the preview arc and preview numeral use.
 * The colour is read from the sector, so the two cannot drift apart.
 */
test('recolours a numeral on hover', async () => {
    const runtime = createMockRuntime()
    // Parked at a running timer, which draws the remaining sector.
    runtime.forceStatus('running')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    const sector = svg.querySelector('[class*="sector"]') as SVGPathElement
    const remaining = getComputedStyle(sector).fill

    const numeral = numeralElement(svg, 15)
    expect(getComputedStyle(numeral).fill).not.toBe(remaining)

    await page.elementLocator(numeral).hover()

    await vi.waitFor(() => {
        expect(getComputedStyle(numeral).fill).toBe(remaining)
    })
})

/**
 * The face's stacking order is deliberate: the remaining sector is painted over
 * the ticks, so its translucent fill tints the ticks it swallows — the
 * physical-timer look — and under the numerals and the preview chrome. The
 * numerals sit outside the disc (`dial.test.ts` pins that), so the order is not
 * what makes them legible today; it is what keeps them legible if the disc ever
 * grows into the numeral ring.
 */
test('paints the remaining sector over the ticks and under the numerals', async () => {
    const runtime = createMockRuntime()
    // Parked part-way through a run, so the sector is drawn across the ring.
    runtime.forceStatus('running')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    const sector = svg.querySelector('[class*="sector"]')
    const ticks = svg.querySelector('[data-dial-ticks]')
    if (!sector || !ticks) throw new Error('the running timer has not drawn its ticks and its sector')

    const numerals = Array.from(svg.querySelectorAll('text[data-numeral-minutes]'))
    expect(numerals).toHaveLength(NUMERAL_MINUTES.length)

    // PRECEDING means the other element is painted first.
    expect(sector.compareDocumentPosition(ticks) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy()
    for (const numeral of numerals) {
        expect(sector.compareDocumentPosition(numeral) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
})

/**
 * Replacing a running timer is one click, with no confirmation step: the worst
 * case is simply setting the timer again.
 */
test('replaces a running timer from a numeral without confirming', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('running')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    await page.elementLocator(numeralElement(svg, 10)).click()

    expect(runtime.getState().status).toBe('running')
    expect(runtime.getState().durationSeconds).toBe(10 * SECONDS_PER_MINUTE)
    // The corner controls are never replaced by a confirmation prompt.
    expect(screen.container.textContent).not.toContain('already in progress')
    runtime.reset()
})

/** The same one-click replacement works through the dial's preview mechanism. */
test('replaces a running timer from the dial without confirming', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('running')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    const onDisc = pointOnDial(20, DISC_RADIUS - 2)
    const matrix = svg.getScreenCTM()
    if (!matrix) throw new Error('the slider has no screen CTM')
    const at = new DOMPoint(onDisc.x, onDisc.y).matrixTransform(matrix)

    svg.dispatchEvent(new MouseEvent('click', { clientX: at.x, clientY: at.y, bubbles: true }))

    expect(runtime.getState().durationSeconds).toBe(20 * SECONDS_PER_MINUTE)
    runtime.reset()
})

/**
 * The readout control (AGENTS.md "Readout control"): pause/resume — and restart
 * while ringing — on the readout disc, revealed on hover. It is a real
 * `<button>` overlaid on the face, whose click surface is the whole disc.
 */
const READOUT_CONTROL_STATES: readonly { status: TimerStatus; label: string }[] = [
    { status: 'running', label: 'Pause' },
    { status: 'paused', label: 'Resume' },
    { status: 'expired', label: 'Restart timer' },
]

const transportGroup = { name: 'Timer controls', exact: true } as const

/** Pause/resume and restart all moved off the corner controls, onto the disc. */
test('leaves pause/resume and restart out of the corner controls', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('running')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    const transport = screen.getByRole('group', transportGroup).element()
    const labels = [...transport.querySelectorAll('button')].map((button) => button.getAttribute('aria-label'))
    // One per corner, in corner order: top left, top right, bottom left, bottom
    // right. The popup's fullscreen button opens a tab instead (see `lib/surface.ts`).
    expect(labels).toEqual(['Mute', 'Open in a tab', 'Reset', 'Settings'])
})

/**
 * The corner controls sit on the dial's square, so they would sit in the way of
 * the choice being made. While the dial is previewed they fade out with the
 * numeral ring, and come straight back when the pointer leaves the disc — which
 * it must do to reach a control (AGENTS.md "Set a custom timer"). The fade keys off
 * the same `data-pickable` signal the face sets, so the two cannot disagree.
 */
test('fades the corner controls out while the dial is previewed', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('idle')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    const transport = screen.getByRole('group', transportGroup).element()
    expect(getComputedStyle(transport).opacity).toBe('1')

    // Preview a duration by moving the pointer onto the disc, off the readout
    // disc at its centre.
    const onDisc = pointOnDial(20, DISC_RADIUS - 2)
    const matrix = svg.getScreenCTM()
    if (!matrix) throw new Error('the slider has no screen CTM')
    const at = new DOMPoint(onDisc.x, onDisc.y).matrixTransform(matrix)
    svg.dispatchEvent(new PointerEvent('pointermove', { clientX: at.x, clientY: at.y, bubbles: true }))

    await vi.waitFor(() => expect(getComputedStyle(transport).opacity).toBe('0'))

    // Off the disc — where a corner control lives — they come straight back.
    const rect = svg.getBoundingClientRect()
    svg.dispatchEvent(new PointerEvent('pointermove', { clientX: rect.left + 2, clientY: rect.top + 2, bubbles: true }))

    await vi.waitFor(() => expect(getComputedStyle(transport).opacity).toBe('1'))
})

/** The Lucide glyph a corner control is showing, e.g. `lucide-shrink`. */
function glyph(control: Element): string {
    const svg = control.querySelector('svg')
    if (!svg) throw new Error('the control has no glyph')
    return [...svg.classList].find((name) => name.startsWith('lucide-')) ?? ''
}

/**
 * A muted timer shows the speaker with a slash through it — `volume-off` — rather
 * than the speaker with an x (`volume-x`), which reads as a different thing.
 */
test('shows the volume-off glyph while the timer is muted', async () => {
    const runtime = createMockRuntime()
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    const mute = screen.getByRole('button', { name: 'Mute', exact: true }).element()
    expect(glyph(mute)).toBe('lucide-volume-2')

    await screen.getByRole('button', { name: 'Mute', exact: true }).click()
    expect(runtime.getState().muted).toBe(true)

    await vi.waitFor(() => {
        expect(screen.getByRole('button', { name: 'Unmute', exact: true }).element()).toBe(mute)
        expect(glyph(mute)).toBe('lucide-volume-off')
    })
})

/**
 * The fullscreen control says what pressing it will do: it offers fullscreen
 * while the page is normal, and swaps to the shrink glyph and the matching label
 * once the document *is* fullscreen (AGENTS.md "Full screen"). The real Fullscreen
 * API needs a user gesture, so `fullscreenElement` is stood in for; the event
 * fired here is the one the browser fires.
 */
test('flips the fullscreen control with the document fullscreen state', async () => {
    const runtime = createMockRuntime()
    const screen = await render(stage(<TimerApp surface="fullscreen" runtime={runtime} />))

    const control = screen.getByRole('button', { name: 'Full screen', exact: true }).element()
    expect(glyph(control)).toBe('lucide-expand')

    Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        get: () => document.documentElement,
    })
    document.dispatchEvent(new Event('fullscreenchange'))

    await vi.waitFor(() => {
        expect(screen.getByRole('button', { name: 'Exit full screen', exact: true }).element()).toBe(control)
        expect(glyph(control)).toBe('lucide-shrink')
    })

    delete (document as { fullscreenElement?: Element }).fullscreenElement
    document.dispatchEvent(new Event('fullscreenchange'))

    await vi.waitFor(() => {
        expect(screen.getByRole('button', { name: 'Full screen', exact: true }).element()).toBe(control)
        expect(glyph(control)).toBe('lucide-expand')
    })
})

/**
 * The four controls are pinned to the corners of the dial's square rather than to
 * a row of their own (AGENTS.md "Transport"), and none of them reaches the dial, so
 * the face keeps its whole surface. The square is the letterboxed SVG (a square
 * viewBox), so its centre is the element's centre and its side is the smaller of
 * the element's two sides.
 */
test('pins one control to each corner of the dial square, clear of the dial', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('idle')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    const rect = svg.getBoundingClientRect()
    const side = Math.min(rect.width, rect.height)
    const centre = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    /** Screen pixels per dial unit. */
    const unit = side / DIAL_VIEWBOX_WIDTH

    const corners = [
        { name: 'Mute', across: -1, down: -1 },
        { name: 'Open in a tab', across: 1, down: -1 },
        { name: 'Reset', across: -1, down: 1 },
        { name: 'Settings', across: 1, down: 1 },
    ] as const

    for (const corner of corners) {
        const button = screen.getByRole('button', { name: corner.name, exact: true }).element()
        const box = button.getBoundingClientRect()
        const dx = box.left + box.width / 2 - centre.x
        const dy = box.top + box.height / 2 - centre.y

        // On the named side of the dial on both axes, and still inside the square.
        expect(Math.sign(dx)).toBe(corner.across)
        expect(Math.sign(dy)).toBe(corner.down)
        expect(Math.abs(dx)).toBeLessThanOrEqual(side / 2)
        expect(Math.abs(dy)).toBeLessThanOrEqual(side / 2)

        // Its nearest point to the dial centre is outside the numeral ring.
        const nearestX = corner.across > 0 ? box.left : box.right
        const nearestY = corner.down > 0 ? box.top : box.bottom
        expect(Math.hypot(nearestX - centre.x, nearestY - centre.y)).toBeGreaterThan(NUMERAL_RADIUS * unit)
    }
})

/** An idle timer has nothing to pause, resume or restart, so the disc stays bare. */
test('has no readout control while the timer is idle', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('idle')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    const stageElement = screen.getByRole('slider').element().parentElement
    expect(stageElement?.querySelector('button')).toBeNull()
})

test('reveals the readout control on hover, hiding the readout', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('running')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    const readout = svg.querySelector('text[class*="readout"]') as SVGTextElement
    const disc = svg.querySelector('circle[class*="readoutDisc"]') as SVGCircleElement
    const control = screen.getByRole('button', { name: 'Pause', exact: true }).element() as HTMLButtonElement

    // The click surface is the whole readout disc: same size, same centre.
    const discBox = disc.getBoundingClientRect()
    const controlBox = control.getBoundingClientRect()
    expect(controlBox.width).toBeCloseTo(discBox.width, 0)
    expect(controlBox.height).toBeCloseTo(discBox.height, 0)
    expect(controlBox.left + controlBox.width / 2).toBeCloseTo(discBox.left + discBox.width / 2, 0)
    expect(controlBox.top + controlBox.height / 2).toBeCloseTo(discBox.top + discBox.height / 2, 0)

    // It wears the remaining sector's colour — the shared `--remaining` token, so
    // the two cannot drift apart.
    const sector = svg.querySelector('[class*="sector"]') as SVGElement
    expect(getComputedStyle(control).color).toBe(getComputedStyle(sector).fill)

    // Park the pointer off the disc first — on the mute control in the corner —
    // so the hidden state is a real reading.
    await screen.getByRole('button', { name: 'Mute', exact: true }).hover()
    await vi.waitFor(() => {
        expect(getComputedStyle(control).opacity).toBe('0')
        expect(getComputedStyle(readout).opacity).toBe('1')
    })

    await screen.getByRole('button', { name: 'Pause', exact: true }).hover()
    await vi.waitFor(() => {
        expect(getComputedStyle(control).opacity).toBe('1')
        expect(getComputedStyle(readout).opacity).toBe('0')
    })
})

for (const { status, label } of READOUT_CONTROL_STATES) {
    test(`shows the ${status} readout control`, async () => {
        const runtime = createMockRuntime()
        runtime.forceStatus(status)
        const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

        const control = screen.getByRole('button', { name: label, exact: true })
        await control.hover()
        await vi.waitFor(() => expect(getComputedStyle(control.element()).opacity).toBe('1'))

        await expect(page.elementLocator(screen.container)).toMatchScreenshot(`readout-control-${status}`)
    })
}

test('pauses a running timer from the readout control', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('running')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    await screen.getByRole('button', { name: 'Pause', exact: true }).click()
    expect(runtime.getState().status).toBe('paused')
})

test('resumes a paused timer from the readout control', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('paused')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    await screen.getByRole('button', { name: 'Resume', exact: true }).click()
    expect(runtime.getState().status).toBe('running')
    runtime.reset()
})

test('restarts the last timer from the readout control while ringing', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('expired')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    await screen.getByRole('button', { name: 'Restart timer', exact: true }).click()
    expect(runtime.getState().status).toBe('running')
    expect(runtime.getState().durationSeconds).toBe(7 * SECONDS_PER_MINUTE)
    runtime.reset()
})

/**
 * The creator mark wears the dial's ink — the same `--dial-mark` the numerals and
 * ticks use (AGENTS.md "Creator mark") — so the Settings screen's tick colour
 * recolours all three together. Read from a numeral, so the mark cannot drift from
 * them.
 */
test('draws the creator mark in the numerals’ ink', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('idle')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    const mark = svg.querySelector('[class*="creatorMark"]')
    if (!mark) throw new Error('the creator mark is not on the face')
    const art = mark.querySelector('path')
    if (!art) throw new Error('the creator mark has no art')

    expect(getComputedStyle(art).fill).toBe(getComputedStyle(numeralElement(svg, 15)).fill)
})
