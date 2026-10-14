/**
 * The toolbar badge (AGENTS.md "Features").
 *
 * Chrome wakes an MV3 service worker about once a minute at best, so a badge
 * that counted seconds would drift and flicker; the badge therefore shows whole
 * remaining minutes only. Its colour comes from `shared/remainingColor.ts` — the
 * same function the dial uses — so the badge and the dial always read the same
 * moment the same way.
 *
 * Pure and free of `chrome.*`: the worker only applies the plan, and the unit
 * project (`npm test`) can exercise it directly.
 */

import { SECONDS_PER_MINUTE } from '../app/lib/time'
import { remainingColorFor } from '../shared/remainingColor'
import type { TimerRecord } from '../shared/timer'

// The ramp lives in `shared/remainingColor.ts`; re-exported so the badge's tests
// (and any existing caller) keep importing it from here.
export { badgeColorFor } from '../shared/remainingColor'

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

/** The badge a record shows at `remainingSeconds`; `''` text clears it. */
export function badgePlanFor(record: TimerRecord, remainingSeconds: number): BadgePlan {
    const fraction = record.durationSeconds > 0 ? remainingSeconds / record.durationSeconds : 0
    const color = remainingColorFor(record.status, fraction)

    switch (record.status) {
        case 'running':
        case 'paused':
            return { text: String(badgeMinutesFor(remainingSeconds)), color }

        default:
            return { text: '', color }
    }
}
