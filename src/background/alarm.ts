/**
 * The toolbar's alert icon (AGENTS.md "Notification").
 *
 * While the alarm sounds, the toolbar shows an alert icon instead of the dial,
 * so a glance at the toolbar says "something is ringing" even with no timer
 * surface open. The alert lasts exactly as long as the ring — both are driven by
 * the record's `ringUntil` — so the icon can never drift out of step with the
 * sound.
 *
 * Pure and free of `chrome.*`, like `badge.ts`: the worker only applies the
 * result, and the unit project (`npm test`) can exercise it directly.
 */

import type { TimerRecord } from '../shared/timer'

/** The two toolbar arts: the dial, and the alert shown while ringing. */
export type ToolbarIcon = 'normal' | 'alert'

/** Whether the alarm is sounding right now: expired, un-muted, inside the ring. */
export function ringingNow(record: TimerRecord, now: number): boolean {
    if (record.status !== 'expired' || record.muted) return false
    return record.ringUntil !== null && now < record.ringUntil
}

/** The toolbar icon the record calls for at `now`. */
export function toolbarIconFor(record: TimerRecord, now: number): ToolbarIcon {
    return ringingNow(record, now) ? 'alert' : 'normal'
}
