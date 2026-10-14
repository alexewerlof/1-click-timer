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
import { createMockSettings } from './runtime/mockSettings'
import { createMockRuntime } from './runtime/mockRuntime'
import type { RemainingColor } from './runtime/settings'
import type { TimerStatus } from './runtime/types'

/** The square popup panel size from `design/global.css`. */
const POPUP_WIDTH = 380
const POPUP_HEIGHT = 380

// The remaining colour defaults to the gradient, so the dial follows the time
// left in these shots — the shipped appearance.
const settings = createMockSettings()

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

        const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

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
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

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
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

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
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

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
 * 0 and 60 are the same mark, so the half-minute just counter-clockwise of 12
 * o'clock — the minute that reads as 0 — has to preview the whole turn, exactly
 * as its clockwise twin does. It used to preview nothing (0 minutes is the idle
 * state), leaving a dead wedge at the top of the disc (see `nearestMinute`).
 */
test('previews a whole turn just counter-clockwise of 12 o’clock', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('idle')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    // A hair counter-clockwise of 12 o'clock, whose minute rounds down to 0 —
    // and so up to a whole turn. Slightly inside the rim so rounding through the
    // screen matrix cannot land it a hair outside the disc.
    const onDisc = pointOnDial(0.1, DISC_RADIUS - 1)
    const matrix = svg.getScreenCTM()
    if (!matrix) throw new Error('the slider has no screen CTM')
    const at = new DOMPoint(onDisc.x, onDisc.y).matrixTransform(matrix)

    svg.dispatchEvent(new PointerEvent('pointermove', { clientX: at.x, clientY: at.y, bubbles: true }))

    const preview = await vi.waitFor(() => {
        const circle = svg.querySelector('circle[class*="previewArc"]')
        if (!circle) throw new Error('the minute either side of 12 o’clock has not previewed a full circle yet')
        return circle
    })
    await expect.element(page.elementLocator(preview)).toBeVisible()

    // It previews the same whole turn, labelled 60 where the 0 numeral sits.
    const numeral = svg.querySelector('text[class*="previewNumeral"]')
    expect(numeral?.textContent).toBe('60')
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
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    // Exactly on the 15-minute mark, slightly inside the rim so rounding through
    // the screen matrix cannot land the point off the disc.
    const onDisc = pointOnDial(15, DISC_RADIUS - 2)
    const matrix = svg.getScreenCTM()
    if (!matrix) throw new Error('the slider has no screen CTM')
    const at = new DOMPoint(onDisc.x, onDisc.y).matrixTransform(matrix)

    svg.dispatchEvent(new PointerEvent('pointermove', { clientX: at.x, clientY: at.y, bubbles: true }))

    const numeral = await vi.waitFor(() => {
        const preview = svg.querySelector('text[class*="previewNumeral"]')
        if (!preview) throw new Error('the preview numeral has not appeared yet')
        return preview
    })

    expect(numeral.textContent).toBe('15')
    // It takes the 15 numeral's own place on the ring, so it reads as that numeral.
    const expected = pointOnDial(15, NUMERAL_RADIUS)
    expect(Number(numeral.getAttribute('x'))).toBeCloseTo(expected.x, 3)
    expect(Number(numeral.getAttribute('y'))).toBeCloseTo(expected.y, 3)

    // It wears the preview colour — the shared `--preview` token — rather than
    // the numerals' ink. The arc reads the same token, so comparing the two keeps
    // them from drifting apart.
    const arc = svg.querySelector('[class*="previewArc"]') as SVGPathElement
    const remaining = getComputedStyle(arc).stroke
    expect(getComputedStyle(numeral).fill).toBe(remaining)

    // The whole ring fades out, so the preview numeral is the only *visible*
    // number on the face — but the ring stays in the tree, faded, so the numeral
    // under the pointer keeps the hit target that starts the timer.
    await vi.waitFor(() => {
        const ring = svg.querySelector('g[data-dial-numerals]') as SVGGElement
        expect(getComputedStyle(ring).opacity).toBe('0')
    })
    expect(svg.querySelectorAll('g[data-dial-numerals] text[data-numeral-minutes]')).toHaveLength(
        NUMERAL_MINUTES.length,
    )

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

/**
 * Hovering a numeral previews it exactly as hovering the disc at that minute
 * does: the ring fades and the arc and preview numeral appear. The numeral is the
 * same one-click shortcut, so it now shows what it will set before it is clicked
 * (AGENTS.md "Preview numeral").
 */
test('previews a numeral on hover, like the disc', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('idle')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    await page.elementLocator(numeralElement(svg, 40)).hover()

    const previewNumeral = await vi.waitFor(() => {
        const preview = svg.querySelector('text[class*="previewNumeral"]')
        if (!preview) throw new Error('the preview numeral has not appeared yet')
        return preview
    })
    expect(previewNumeral.textContent).toBe('40')

    // The ring fades out, so the preview numeral is the only visible number.
    await vi.waitFor(() => {
        const ring = svg.querySelector('g[data-dial-numerals]') as SVGGElement
        expect(getComputedStyle(ring).opacity).toBe('0')
    })

    // The arc runs from 12 o'clock to the numeral's minute, and the ticks it
    // covers are redrawn in the remaining colour — one per minute, 0 through 40.
    expect(svg.querySelector('[class*="previewArc"]')).not.toBeNull()
    expect(svg.querySelectorAll('line[class*="tickPreview"]')).toHaveLength(41)
})

/**
 * The 0 numeral is the reset control, not a duration, so hovering it previews
 * nothing — the ring stays put and no arc is drawn (AGENTS.md "Set a custom
 * timer").
 */
test('does not preview the 0 numeral on hover', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('idle')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    await page.elementLocator(numeralElement(svg, 0)).hover()

    expect(svg.querySelector('text[class*="previewNumeral"]')).toBeNull()
    expect(svg.querySelector('[class*="previewArc"]')).toBeNull()
    const ring = svg.querySelector('g[data-dial-numerals]') as SVGGElement
    expect(getComputedStyle(ring).opacity).toBe('1')
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
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    await page.elementLocator(numeralElement(svg, 55)).click()

    expect(runtime.getState().status).toBe('running')
    expect(runtime.getState().durationSeconds).toBe(55 * SECONDS_PER_MINUTE)
    runtime.reset()
})

/**
 * The minute either side of 12 o'clock is a whole turn, so clicking the disc
 * just counter-clockwise of the top starts a 60-minute timer — not the 0-minute
 * no-op it used to be. The 0 numeral above it still resets: the disc is a
 * duration, the numeral is the reset control (AGENTS.md "Set a custom timer").
 */
test('starts a whole turn when the disc is clicked beside 12 o’clock', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('idle')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    const onDisc = pointOnDial(0.1, DISC_RADIUS - 1)
    const matrix = svg.getScreenCTM()
    if (!matrix) throw new Error('the slider has no screen CTM')
    const at = new DOMPoint(onDisc.x, onDisc.y).matrixTransform(matrix)

    svg.dispatchEvent(new MouseEvent('click', { clientX: at.x, clientY: at.y, bubbles: true }))

    expect(runtime.getState().status).toBe('running')
    expect(runtime.getState().durationSeconds).toBe(MINUTES_PER_TURN * SECONDS_PER_MINUTE)
    runtime.reset()
})

/**
 * The 0 numeral marks where a whole turn ends, so it is the reset control: a
 * click resets the timer rather than starting a 0-minute one (AGENTS.md "Set a
 * custom timer").
 */
test('resets the timer from the 0 numeral', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('running')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    await page.elementLocator(numeralElement(svg, 0)).click()

    expect(runtime.getState().status).toBe('idle')
    expect(runtime.getState().remainingSeconds).toBe(0)
    expect(runtime.getState().lastDurationSeconds).toBeNull()
})

/**
 * Reset from the 0 numeral silences a ringing alarm too, like the corner's Stop
 * control: the record's `ringUntil` is cleared, so the sound stops (AGENTS.md
 * "Set a custom timer").
 */
test('resets a ringing alarm from the 0 numeral', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('expired')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    await page.elementLocator(numeralElement(svg, 0)).click()

    expect(runtime.getState().status).toBe('idle')
    expect(runtime.getState().lastDurationSeconds).toBeNull()
})

/**
 * A numeral is interactive, so hovering one recolours it to the preview colour —
 * the same signal the preview arc and preview numeral use. The colour is read
 * from the arc, so the two cannot drift apart.
 */
test('recolours a numeral on hover', async () => {
    const runtime = createMockRuntime()
    // Parked at a running timer, which draws the remaining sector.
    runtime.forceStatus('running')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    const numeral = numeralElement(svg, 15)
    const ink = getComputedStyle(numeral).fill

    await page.elementLocator(numeral).hover()

    // Hovering previews the numeral, so the arc appears and the numeral takes its
    // colour. Read from the arc, so the two cannot drift apart.
    const arc = await vi.waitFor(() => {
        const preview = svg.querySelector('[class*="previewArc"]')
        if (!preview) throw new Error('the preview arc has not appeared yet')
        return preview
    })
    await vi.waitFor(() => {
        expect(getComputedStyle(numeral).fill).toBe(getComputedStyle(arc).stroke)
    })
    expect(getComputedStyle(numeral).fill).not.toBe(ink)
})

/**
 * The preview shows the colour a timer will run in, so it never follows the live
 * colour: with Gradient chosen — the default — a paused (grey) timer still
 * previews in the theme's red. Without this the preview turned grey with the
 * sector, which reads as "this timer is grey" rather than "this is the colour
 * you will get".
 */
test('keeps the preview in the chosen colour, not the live paused grey', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('paused')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    const onDisc = pointOnDial(20, DISC_RADIUS - 2)
    const matrix = svg.getScreenCTM()
    if (!matrix) throw new Error('the slider has no screen CTM')
    const at = new DOMPoint(onDisc.x, onDisc.y).matrixTransform(matrix)
    svg.dispatchEvent(new PointerEvent('pointermove', { clientX: at.x, clientY: at.y, bubbles: true }))

    const arc = await vi.waitFor(() => {
        const preview = svg.querySelector('[class*="previewArc"]')
        if (!preview) throw new Error('the preview arc has not appeared yet')
        return preview
    })
    const sector = svg.querySelector('[class*="sector"]') as SVGPathElement

    // The paused sector wears the badge's grey; the preview does not.
    expect(getComputedStyle(sector).fill).toBe('rgb(107, 114, 128)')
    expect(getComputedStyle(arc).stroke).toBe('rgb(224, 32, 27)')
})

/**
 * The face's stacking order is deliberate: the remaining sector is painted over
 * the disc and under the ticks, so its translucent fill reads the disc's edge
 * shadow through it while the ticks keep their full ink, and under the numerals
 * and the preview chrome. The numerals sit outside the disc (`dial.test.ts`
 * pins that), so the order is not what makes them legible today; it is what
 * keeps them legible if the disc ever grows into the numeral ring.
 */
test('paints the remaining sector over the disc and under the ticks and the numerals', async () => {
    const runtime = createMockRuntime()
    // Parked part-way through a run, so the sector is drawn across the ring.
    runtime.forceStatus('running')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    const sector = svg.querySelector('[class*="sector"]')
    const ticks = svg.querySelector('[data-dial-ticks]')
    if (!sector || !ticks) throw new Error('the running timer has not drawn its ticks and its sector')

    const numerals = Array.from(svg.querySelectorAll('text[data-numeral-minutes]'))
    expect(numerals).toHaveLength(NUMERAL_MINUTES.length)

    // PRECEDING/FOLLOWING are relative to the sector: the ticks follow it, so
    // they paint over it, while the numerals follow it too (the fill stays under
    // them).
    expect(sector.compareDocumentPosition(ticks) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
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
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

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
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

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
 * The readout control (AGENTS.md "Readout control"): restart, while the timer is
 * paused or ringing, on the readout disc, revealed on hover. It is a real
 * `<button>` overlaid on the face, whose click surface is the whole disc.
 */
const READOUT_CONTROL_STATES: readonly { status: TimerStatus; label: string }[] = [
    { status: 'paused', label: 'Restart timer' },
    { status: 'expired', label: 'Restart timer' },
]

const transportGroup = { name: 'Timer controls', exact: true } as const

/**
 * Play/pause now lives in the bottom-left corner, and Restart on the readout
 * disc: the corner carries the four everyday controls, with nothing hidden behind
 * a hover. One control per corner, in corner order — top left, top right, bottom
 * left, bottom right. The popup's fullscreen button opens a tab instead (see
 * `lib/surface.ts`).
 */
test('puts play/pause in the bottom-left corner', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('running')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    const transport = screen.getByRole('group', transportGroup).element()
    const labels = [...transport.querySelectorAll('button')].map((button) => button.getAttribute('aria-label'))
    expect(labels).toEqual(['Mute', 'Open in a tab', 'Pause', 'Settings'])
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
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

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
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

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
 * The play/pause control says what pressing it will do: play while the timer is
 * idle, pause while it runs, play while it is paused, and a Stop square while it
 * rings — stopping resets the timer, which also silences the alarm (AGENTS.md
 * "Stop a timer", "Restart the timer"). An idle timer has nothing to act on, so
 * its control is disabled.
 */
const PAUSE_CONTROL_STATES: readonly {
    status: TimerStatus
    label: string
    glyph: string
    disabled?: boolean
}[] = [
    { status: 'idle', label: 'Play', glyph: 'lucide-play', disabled: true },
    { status: 'running', label: 'Pause', glyph: 'lucide-pause' },
    { status: 'paused', label: 'Resume', glyph: 'lucide-play' },
    { status: 'expired', label: 'Stop', glyph: 'lucide-square' },
]

for (const { status, label, glyph: expected, disabled } of PAUSE_CONTROL_STATES) {
    test(`shows the ${status} play/pause control`, async () => {
        const runtime = createMockRuntime()
        runtime.forceStatus(status)
        const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

        const control = screen.getByRole('button', { name: label, exact: true }).element() as HTMLButtonElement
        expect(glyph(control)).toBe(expected)
        expect(control.disabled).toBe(disabled ?? false)
    })
}

test('pauses a running timer from the corner control', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('running')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    await screen.getByRole('button', { name: 'Pause', exact: true }).click()
    expect(runtime.getState().status).toBe('paused')
})

test('resumes a paused timer from the corner control', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('paused')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    await screen.getByRole('button', { name: 'Resume', exact: true }).click()
    expect(runtime.getState().status).toBe('running')
    runtime.reset()
})

test('stops a ringing alarm from the corner control, resetting the timer', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('expired')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    await screen.getByRole('button', { name: 'Stop', exact: true }).click()
    expect(runtime.getState().status).toBe('idle')
    expect(runtime.getState().remainingSeconds).toBe(0)
    expect(runtime.getState().lastDurationSeconds).toBeNull()
})

/**
 * The corner controls answer in the accent, and the accent follows the “Remaining”
 * choice: the theme's red under Gradient, and the calm green under either pinned
 * colour. It is deliberately NOT the colour the dial's sector wears, so a red
 * timer still answers in green.
 */
const ACCENTS: readonly { remaining: RemainingColor; accent: string }[] = [
    { remaining: 'gradient', accent: 'rgb(224, 32, 27)' },
    { remaining: 'red', accent: 'rgb(11, 128, 67)' },
    { remaining: 'green', accent: 'rgb(11, 128, 67)' },
]

for (const { remaining, accent } of ACCENTS) {
    test(`hovers a corner control in the ${remaining} accent`, async () => {
        const runtime = createMockRuntime()
        runtime.forceStatus('idle')
        const screen = await render(
            stage(<TimerApp surface="popup" runtime={runtime} settingsStore={createMockSettings({ remaining })} />),
        )

        const mute = screen.getByRole('button', { name: 'Mute', exact: true })
        await mute.hover()
        await vi.waitFor(() => expect(getComputedStyle(mute.element()).color).toBe(accent))
    })
}

/**
 * The fullscreen control says what pressing it will do: it offers fullscreen
 * while the page is normal, and swaps to the shrink glyph and the matching label
 * once the document *is* fullscreen (AGENTS.md "Full screen"). The real Fullscreen
 * API needs a user gesture, so `fullscreenElement` is stood in for; the event
 * fired here is the one the browser fires.
 */
test('flips the fullscreen control with the document fullscreen state', async () => {
    const runtime = createMockRuntime()
    const screen = await render(stage(<TimerApp surface="fullscreen" runtime={runtime} settingsStore={settings} />))

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
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    const rect = svg.getBoundingClientRect()
    const side = Math.min(rect.width, rect.height)
    const centre = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    /** Screen pixels per dial unit. */
    const unit = side / DIAL_VIEWBOX_WIDTH

    const corners = [
        { name: 'Mute', across: -1, down: -1 },
        { name: 'Open in a tab', across: 1, down: -1 },
        { name: 'Play', across: -1, down: 1 },
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

/**
 * The disc only offers Restart, and only when there is a duration to restore: an
 * idle timer (nothing to restore) and a running one (play/pause is in the corner)
 * both leave it bare.
 */
for (const status of ['idle', 'running'] as const) {
    test(`has no readout control while the timer is ${status}`, async () => {
        const runtime = createMockRuntime()
        runtime.forceStatus(status)
        const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

        const stageElement = screen.getByRole('slider').element().parentElement
        expect(stageElement?.querySelector('button')).toBeNull()
    })
}

test('reveals the readout control on hover, hiding the readout', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('paused')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    const readout = svg.querySelector('text[class*="readout"]') as SVGTextElement
    const disc = svg.querySelector('circle[class*="readoutDisc"]') as SVGCircleElement
    const control = screen.getByRole('button', { name: 'Restart timer', exact: true }).element() as HTMLButtonElement

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

    await screen.getByRole('button', { name: 'Restart timer', exact: true }).hover()
    await vi.waitFor(() => {
        expect(getComputedStyle(control).opacity).toBe('1')
        expect(getComputedStyle(readout).opacity).toBe('0')
    })
})

for (const { status, label } of READOUT_CONTROL_STATES) {
    test(`shows the ${status} readout control`, async () => {
        const runtime = createMockRuntime()
        runtime.forceStatus(status)
        const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

        const control = screen.getByRole('button', { name: label, exact: true })
        await control.hover()
        await vi.waitFor(() => expect(getComputedStyle(control.element()).opacity).toBe('1'))

        await expect(page.elementLocator(screen.container)).toMatchScreenshot(`readout-control-${status}`)
    })
}

test('restarts the last timer from the readout control while ringing', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('expired')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    await screen.getByRole('button', { name: 'Restart timer', exact: true }).click()
    expect(runtime.getState().status).toBe('running')
    expect(runtime.getState().durationSeconds).toBe(7 * SECONDS_PER_MINUTE)
    runtime.reset()
})

/**
 * Restart is offered while the timer is paused too — a 10-minute timer paused at
 * 5 minutes restarts at the full 10. It is the beginning-of-duration restart, not
 * a resume of the time left.
 */
test('restarts the last duration from the readout control while paused', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('paused')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    await screen.getByRole('button', { name: 'Restart timer', exact: true }).click()
    expect(runtime.getState().status).toBe('running')
    expect(runtime.getState().durationSeconds).toBe(25 * SECONDS_PER_MINUTE)
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
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    const mark = svg.querySelector('[class*="creatorMark"]')
    if (!mark) throw new Error('the creator mark is not on the face')
    const art = mark.querySelector('path')
    if (!art) throw new Error('the creator mark has no art')

    expect(getComputedStyle(art).fill).toBe(getComputedStyle(numeralElement(svg, 15)).fill)
})

/**
 * The mark belongs to the maker, not to the timer: while a timer counts down the
 * remaining sector is the only thing that should hold the eye — on a classroom
 * projector above all — so the branding steps aside and comes back when the timer
 * stops. It is faded rather than unmounted, so neither move pops.
 */
test('hides the creator mark while the timer runs', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('idle')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    const mark = svg.querySelector('[class*="creatorMark"]') as SVGElement
    if (!mark) throw new Error('the creator mark is not on the face')

    // Idle: the mark is showing.
    expect(getComputedStyle(mark).opacity).toBe('1')

    runtime.forceStatus('running')
    await vi.waitFor(() => expect(getComputedStyle(mark).opacity).toBe('0'))

    // Still in the tree while hidden — the fade needs it there.
    expect(svg.querySelector('[class*="creatorMark"]')).not.toBeNull()

    runtime.forceStatus('idle')
    await vi.waitFor(() => expect(getComputedStyle(mark).opacity).toBe('1'))
})

/**
 * Clicking the dial focuses the face (it is a `role="slider"` with `tabindex=0`),
 * and focus alone must not draw a ring. The `<svg>` used to get the browser's own
 * default outline — an unrounded amber rectangle, distinct from the app's rounded
 * accent ring — because only `:focus-visible` was styled; `global.css` now cancels
 * the default wherever focus is not `:focus-visible`. The ring is reserved for the
 * keyboard, so clicking the middle of the face leaves it bare.
 */
test('draws no focus ring on the face when clicked', async () => {
    const runtime = createMockRuntime()
    runtime.forceStatus('idle')
    const screen = await render(stage(<TimerApp surface="popup" runtime={runtime} settingsStore={settings} />))

    const svg = screen.getByRole('slider').element() as SVGSVGElement
    // The readout disc at the centre starts no timer while idle, so the click
    // only focuses the face.
    await page.elementLocator(svg).click()

    expect(document.activeElement).toBe(svg)
    expect(svg.matches(':focus-visible')).toBe(false)
    expect(getComputedStyle(svg).outlineStyle).toBe('none')
})
