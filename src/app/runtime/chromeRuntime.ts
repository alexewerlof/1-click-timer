/**
 * The real `TimerRuntime`: the UI's view of the timer that lives in
 * `chrome.storage.local` and is written only by the service worker.
 *
 * The UI never accumulates time. It caches the persisted record, recomputes the
 * remaining seconds from the absolute `endTime` on a short interval while
 * running (for a smooth dial), and treats `chrome.storage.onChanged` as the one
 * way state arrives back from the worker. Every method is a message; the worker
 * applies the action and persists the result.
 */

import {
    expireIfElapsed,
    IDLE_TIMER,
    normalizeTimerRecord,
    TIMER_STORAGE_KEY,
    type TimerRecord,
    type TimerRequest,
} from '../../shared/timer'
import { toTimerState } from './timerState'
import type { TimerRuntime, TimerState, TimerStateListener } from './types'

/** 4 Hz keeps the dial smooth without thrashing React — the mock's cadence. */
const TICK_MS = 250

function sameState(a: TimerState, b: TimerState): boolean {
    return (
        a.status === b.status &&
        a.remainingSeconds === b.remainingSeconds &&
        a.durationSeconds === b.durationSeconds &&
        a.muted === b.muted &&
        a.lastDurationSeconds === b.lastDurationSeconds
    )
}

export function createChromeRuntime(): TimerRuntime {
    let record: TimerRecord = IDLE_TIMER
    let state: TimerState = toTimerState(record, Date.now())
    const listeners = new Set<TimerStateListener>()
    let tickId: ReturnType<typeof setInterval> | null = null

    function stopTicking(): void {
        if (tickId === null) return
        clearInterval(tickId)
        tickId = null
    }

    function syncTicking(): void {
        if (record.status === 'running' && tickId === null) {
            tickId = setInterval(refresh, TICK_MS)
        } else if (record.status !== 'running') {
            stopTicking()
        }
    }

    function publish(): void {
        const next = toTimerState(record, Date.now())
        if (sameState(next, state)) return
        state = next
        for (const listener of listeners) listener(state)
    }

    function refresh(): void {
        record = expireIfElapsed(record, Date.now())
        publish()
        syncTicking()
    }

    function apply(next: TimerRecord): void {
        record = next
        refresh()
    }

    function send(request: TimerRequest): void {
        void chrome.runtime.sendMessage(request).catch(() => {
            // No worker listening (e.g. it is starting); the storage change
            // will still arrive once the action lands.
        })
    }

    void (async () => {
        try {
            const stored = await chrome.storage.local.get(TIMER_STORAGE_KEY)
            apply(normalizeTimerRecord(stored[TIMER_STORAGE_KEY]))
        } catch {
            // Leave the idle default in place.
        }
    })()

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local') return
        const change = changes[TIMER_STORAGE_KEY]
        if (change) apply(normalizeTimerRecord(change.newValue))
    })

    return {
        getState: () => state,

        subscribe(listener) {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },

        start(seconds) {
            send({ action: 'start', seconds })
        },
        pause() {
            send({ action: 'pause' })
        },
        resume() {
            send({ action: 'resume' })
        },
        togglePause() {
            send({ action: 'togglePause' })
        },
        reset() {
            send({ action: 'reset' })
        },
        restart() {
            send({ action: 'restart' })
        },
        toggleMute() {
            send({ action: 'toggleMute' })
        },
    }
}
