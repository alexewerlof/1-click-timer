/**
 * The remaining-time colour choices the settings screen offers (AGENTS.md
 * "Settings").
 *
 * This is the only place the swatch colours live, and they are the badge's own
 * ramp stops (`shared/remainingColor.ts`), so the swatch, the fixed colours and
 * the toolbar badge can never drift apart. `Conic` — the default — freezes that
 * ramp to the dial when the timer starts, so the shrinking sector reveals it (see
 * `conicGradientFor`); `Gradient` leaves the colour to `useRemainingColor`, which
 * follows the time left; the other two pin it flat. Each choice also decides the
 * interactive accent (`accentColorFor`).
 */

import { REMAINING_CALM, REMAINING_HALFWAY, REMAINING_URGENT } from '../../shared/remainingColor'
import { clampSeconds, MAX_SECONDS } from '../lib/time'
import type { RemainingColor } from '../runtime/settings'

export interface RemainingSwatch {
    value: RemainingColor
    label: string
}

/** The choices, in display order: Conic first, because it is the default. */
export const REMAINING_SWATCHES: readonly RemainingSwatch[] = [
    { value: 'conic', label: 'Conic' },
    { value: 'gradient', label: 'Gradient' },
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
]

/** The ramp as a vertical swatch: green at the bottom, red at the top. */
const GRADIENT_BACKGROUND = `linear-gradient(0deg, ${REMAINING_CALM}, ${REMAINING_HALFWAY}, ${REMAINING_URGENT})`

/**
 * The ramp as a wheel for the Conic chip: the same three stops swept round from
 * the top, so the seam where green meets red sits at 12 o'clock — the same place
 * the dial's sector starts and ends.
 */
const CONIC_SWEEP = `conic-gradient(${REMAINING_CALM}, ${REMAINING_HALFWAY}, ${REMAINING_URGENT})`

/** The colour a fixed swatch pins the remaining indicator to, or `null` for a ramp. */
export function fixedRemainingColor(value: RemainingColor): string | null {
    if (value === 'red') return REMAINING_URGENT
    if (value === 'green') return REMAINING_CALM
    return null
}

/**
 * The interactive accent a choice implies — the controls' hover and focus colour.
 * Red and Green both take the calm green; Gradient and Conic leave it to the
 * theme's own red (`null`), so the accent never follows the ramp. Deliberately
 * not the remaining colour under Red: a red timer answers in green.
 */
export function accentColorFor(value: RemainingColor): string | null {
    return value === 'red' || value === 'green' ? REMAINING_CALM : null
}

/** The CSS `background` for a swatch chip: a ramp, or the colour a choice pins. */
export function swatchBackground(value: RemainingColor): string {
    if (value === 'conic') return CONIC_SWEEP
    return fixedRemainingColor(value) ?? GRADIENT_BACKGROUND
}

/**
 * The fixed sweep the Conic appearance paints the remaining sector with: green
 * where the timer started, red at 12 o'clock where it ends, orange half way — the
 * badge's own ramp, drawn once and left alone as the sector shrinks over it
 * (AGENTS.md "Remaining sector").
 *
 * The stops sit in the dial's own geometry. A CSS conic gradient runs clockwise
 * from 12 o'clock while the dial runs counter-clockwise, so a timer's whole
 * duration spans clockwise from `360 - span` to a whole turn, and its half way
 * point sits at `360 - span / 2`. A 15-minute timer therefore puts its green at
 * 270° (9 o'clock) and its red at 360° (12 o'clock) — exactly where its sector
 * starts and ends — so the sector begins green and ends red at every duration.
 */
export function conicGradientFor(durationSeconds: number): string {
    const span = (360 * clampSeconds(durationSeconds)) / MAX_SECONDS
    const green = 360 - span
    const halfway = 360 - span / 2
    return `conic-gradient(${REMAINING_CALM} 0deg, ${REMAINING_CALM} ${green}deg, ${REMAINING_HALFWAY} ${halfway}deg, ${REMAINING_URGENT} 360deg)`
}
