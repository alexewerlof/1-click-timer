/**
 * The colour of "how much time is left", and the one place it is computed.
 *
 * Both the toolbar badge (`background/badge.ts`) and the dial's remaining colour
 * (`app/runtime/useRemainingColor.ts`) resolve through here, so a tweak to the
 * ramp — or to the grey a paused timer wears — lands in both at once and the
 * badge can never disagree with the dial.
 *
 * The ramp says how much of the *running* timer is left: green at the start,
 * orange at the halfway point, red as the time runs out. So a 3-minute and a
 * 30-minute timer both start green and both end red.
 *
 * Pure and free of `chrome.*` and of `app/`: the worker, the UI and the unit
 * project all import it.
 */

import type { TimerStatus } from './timer'

interface Rgb {
    r: number
    g: number
    b: number
}

/** Green: the timer has just started. */
const CALM: Rgb = { r: 0x0b, g: 0x80, b: 0x43 }
/** Orange: half the timer is left. */
const HALFWAY: Rgb = { r: 0xe8, g: 0x71, b: 0x0a }
/** Red: the time is up — the same ink the dial uses for its remaining sector. */
const URGENT: Rgb = { r: 0xe0, g: 0x20, b: 0x1b }
/** Grey: a paused timer is neither calm nor urgent. */
const PAUSED: Rgb = { r: 0x6b, g: 0x72, b: 0x80 }

/** The fraction of the timer that is left when the ramp passes through orange. */
const HALFWAY_POINT = 0.5

function mix(from: Rgb, to: Rgb, amount: number): Rgb {
    return {
        r: Math.round(from.r + (to.r - from.r) * amount),
        g: Math.round(from.g + (to.g - from.g) * amount),
        b: Math.round(from.b + (to.b - from.b) * amount),
    }
}

function css({ r, g, b }: Rgb): string {
    return `rgb(${r}, ${g}, ${b})`
}

/** The ramp's three stops, as CSS colours — the swatch's gradient is built from them. */
export const REMAINING_CALM = css(CALM)
export const REMAINING_HALFWAY = css(HALFWAY)
export const REMAINING_URGENT = css(URGENT)

/** The grey a paused timer wears — the same ink `remainingColorFor` gives a pause. */
export const REMAINING_PAUSED = css(PAUSED)

/** The colour as the fraction of the timer that is left runs 0…1 along the ramp. */
export function badgeColorFor(fractionRemaining: number): string {
    const fraction = Math.min(1, Math.max(0, fractionRemaining))
    if (fraction >= HALFWAY_POINT) {
        return css(mix(HALFWAY, CALM, (fraction - HALFWAY_POINT) / (1 - HALFWAY_POINT)))
    }
    return css(mix(URGENT, HALFWAY, fraction / HALFWAY_POINT))
}

/**
 * The colour the remaining indicator wears for a whole timer: the ramp while it
 * runs, the grey while it is paused, red once the time is up, and the calm green
 * while it is idle. `fractionRemaining` is only read while running.
 */
export function remainingColorFor(status: TimerStatus, fractionRemaining: number): string {
    switch (status) {
        case 'running':
            return badgeColorFor(fractionRemaining)
        case 'paused':
            return css(PAUSED)
        case 'expired':
            return css(URGENT)
        default:
            return css(CALM)
    }
}
