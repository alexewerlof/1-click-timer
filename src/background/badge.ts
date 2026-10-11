/**
 * The toolbar badge (AGENTS.md "Features").
 *
 * Chrome wakes an MV3 service worker about once a minute at best, so a badge
 * that counted seconds would drift and flicker; the badge therefore shows whole
 * remaining minutes only. Its colour says how much of the *running* timer is
 * left — green at the start, orange at the halfway point, red as the time runs
 * out — so a 3-minute and a 30-minute timer both start green and both end red.
 *
 * Pure and free of `chrome.*`: the worker only applies the plan, and the unit
 * project (`npm test`) can exercise it directly.
 */

import { SECONDS_PER_MINUTE } from '../app/lib/time'
import type { TimerRecord } from '../shared/timer'

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
const PAUSED_COLOR = 'rgb(107, 114, 128)'

/** The fraction of the timer that is left when the badge shows orange. */
const HALFWAY_POINT = 0.5

/** The badge text and colour a record calls for. */
export interface BadgePlan {
    /** The badge text; `''` clears the badge. */
    text: string
    /** The badge background, as a CSS colour. */
    color: string
}

/** Whole minutes left, floored: 1:05 left shows as `1` (AGENTS.md "Features"). */
export function badgeMinutesFor(remainingSeconds: number): number {
    return Math.floor(Math.max(0, remainingSeconds) / SECONDS_PER_MINUTE)
}

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

/** The badge colour for the fraction of the timer that is left (0…1). */
export function badgeColorFor(fractionRemaining: number): string {
    const fraction = Math.min(1, Math.max(0, fractionRemaining))
    if (fraction >= HALFWAY_POINT) {
        return css(mix(HALFWAY, CALM, (fraction - HALFWAY_POINT) / (1 - HALFWAY_POINT)))
    }
    return css(mix(URGENT, HALFWAY, fraction / HALFWAY_POINT))
}

/** The badge a record shows at `remainingSeconds`; `''` text clears it. */
export function badgePlanFor(record: TimerRecord, remainingSeconds: number): BadgePlan {
    switch (record.status) {
        case 'running': {
            const fraction = record.durationSeconds > 0 ? remainingSeconds / record.durationSeconds : 0
            return { text: String(badgeMinutesFor(remainingSeconds)), color: badgeColorFor(fraction) }
        }

        case 'paused':
            return { text: String(badgeMinutesFor(remainingSeconds)), color: PAUSED_COLOR }

        case 'expired':
            return { text: '', color: css(URGENT) }

        default:
            return { text: '', color: css(CALM) }
    }
}
