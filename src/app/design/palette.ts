/**
 * The remaining-time colour choices the settings screen offers (AGENTS.md
 * "Settings").
 *
 * This is the only place the swatch colours live, and they are the badge's own
 * ramp stops (`shared/remainingColor.ts`), so the swatch, the fixed colours and
 * the toolbar badge can never drift apart. `Gradient` — the default — leaves the
 * colour to `useRemainingColor`, which follows the time left; the other two pin
 * it flat. Each choice also decides the interactive accent (`accentColorFor`).
 */

import { REMAINING_CALM, REMAINING_HALFWAY, REMAINING_URGENT } from '../../shared/remainingColor'
import type { RemainingColor } from '../runtime/settings'

export interface RemainingSwatch {
    value: RemainingColor
    label: string
}

/** The choices, in display order: Gradient first, because it is the default. */
export const REMAINING_SWATCHES: readonly RemainingSwatch[] = [
    { value: 'gradient', label: 'Gradient' },
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
]

/** The ramp as a horizontal swatch: red on the left, green on the right. */
const GRADIENT_BACKGROUND = `linear-gradient(90deg, ${REMAINING_URGENT}, ${REMAINING_HALFWAY}, ${REMAINING_CALM})`

/** The colour a fixed swatch pins the remaining indicator to, or `null` for the ramp. */
export function fixedRemainingColor(value: RemainingColor): string | null {
    if (value === 'red') return REMAINING_URGENT
    if (value === 'green') return REMAINING_CALM
    return null
}

/**
 * The interactive accent a choice implies — the controls' hover and focus colour.
 * Red and Green both take the calm green; Gradient leaves it to the theme's own
 * red (`null`), so the accent never follows the ramp. Deliberately not the
 * remaining colour under Red: a red timer answers in green.
 */
export function accentColorFor(value: RemainingColor): string | null {
    return value === 'gradient' ? null : REMAINING_CALM
}

/** The CSS `background` for a swatch chip: the ramp, or the colour it pins. */
export function swatchBackground(value: RemainingColor): string {
    return fixedRemainingColor(value) ?? GRADIENT_BACKGROUND
}
