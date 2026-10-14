import { expireIfElapsed, remainingFrom, type TimerRecord } from '../../shared/timer'
import type { TimerState } from './types'

/**
 * Maps a persisted record to the state the UI renders, resolving a running
 * timer that has run out to `expired` at read time (so the dial reacts the
 * moment the time is up, without waiting for the service worker).
 */
export function toTimerState(record: TimerRecord, now: number): TimerState {
    const resolved = expireIfElapsed(record, now)
    return {
        status: resolved.status,
        remainingSeconds: resolved.status === 'expired' ? 0 : remainingFrom(resolved, now),
        durationSeconds: resolved.durationSeconds,
        muted: resolved.muted,
        lastDurationSeconds: resolved.lastDurationSeconds,
    }
}
