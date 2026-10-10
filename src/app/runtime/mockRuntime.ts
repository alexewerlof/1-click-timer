/**
 * In-memory `TimerRuntime` used while the UI is being designed.
 *
 * It keeps the timer honest about `endTime` (the remaining time is always
 * derived from a timestamp, never accumulated), so the visuals already behave
 * like the real thing — only persistence and Chrome APIs are missing.
 */

import { clampSeconds, MAX_SECONDS, SECONDS_PER_MINUTE } from '../lib/time'
import { DEFAULT_PRESETS } from './presets'
import type { TimerDevControls, TimerRuntime, TimerState, TimerStateListener, TimerStatus } from './types'

/** 4 Hz keeps the dial smooth without thrashing React. */
const TICK_MS = 250

/** Representative parking states for the design harness. */
const DEV_STATES: Record<TimerStatus, Partial<TimerState>> = {
    idle: {
        status: 'idle',
        remainingSeconds: 0,
        durationSeconds: 0,
        lastDurationSeconds: null,
    },
    running: {
        status: 'running',
        remainingSeconds: 12.5 * SECONDS_PER_MINUTE,
        durationSeconds: 30 * SECONDS_PER_MINUTE,
        lastDurationSeconds: 30 * SECONDS_PER_MINUTE,
    },
    paused: {
        status: 'paused',
        remainingSeconds: 9.4 * SECONDS_PER_MINUTE,
        durationSeconds: 25 * SECONDS_PER_MINUTE,
        lastDurationSeconds: 25 * SECONDS_PER_MINUTE,
    },
    expired: {
        status: 'expired',
        remainingSeconds: 0,
        durationSeconds: 7 * SECONDS_PER_MINUTE,
        lastDurationSeconds: 7 * SECONDS_PER_MINUTE,
    },
}

const INITIAL_STATE: TimerState = {
    status: 'idle',
    remainingSeconds: 0,
    durationSeconds: 0,
    muted: false,
    presets: DEFAULT_PRESETS,
    lastDurationSeconds: null,
}

function createMockRuntime(): TimerRuntime & TimerDevControls {
    let state: TimerState = INITIAL_STATE
    const listeners = new Set<TimerStateListener>()
    let tickId: ReturnType<typeof setInterval> | null = null
    let endsAt = 0

    function publish(patch: Partial<TimerState>): void {
        state = { ...state, ...patch }
        for (const listener of listeners) listener(state)
    }

    function stopTicking(): void {
        if (tickId === null) return
        clearInterval(tickId)
        tickId = null
    }

    function remainingNow(): number {
        return Math.max(0, (endsAt - Date.now()) / 1000)
    }

    function tick(): void {
        const remaining = remainingNow()
        if (remaining > 0) {
            publish({ remainingSeconds: remaining })
            return
        }
        stopTicking()
        publish({ status: 'expired', remainingSeconds: 0 })
    }

    function startTicking(): void {
        stopTicking()
        tickId = setInterval(tick, TICK_MS)
    }

    return {
        getState: () => state,

        subscribe(listener) {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },

        start(seconds) {
            const duration = clampSeconds(seconds)
            if (duration <= 0) {
                this.reset()
                return
            }
            endsAt = Date.now() + duration * 1000
            publish({
                status: 'running',
                durationSeconds: duration,
                remainingSeconds: duration,
                lastDurationSeconds: duration,
            })
            startTicking()
        },

        pause() {
            if (state.status !== 'running') return
            stopTicking()
            publish({ status: 'paused', remainingSeconds: remainingNow() })
        },

        resume() {
            if (state.status !== 'paused' || state.remainingSeconds <= 0) return
            endsAt = Date.now() + state.remainingSeconds * 1000
            publish({ status: 'running' })
            startTicking()
        },

        togglePause() {
            if (state.status === 'running') {
                this.pause()
            } else {
                this.resume()
            }
        },

        reset() {
            stopTicking()
            publish({
                status: 'idle',
                remainingSeconds: 0,
                durationSeconds: 0,
                lastDurationSeconds: null,
            })
        },

        restart() {
            const last = state.lastDurationSeconds
            if (last === null) return
            this.start(Math.min(last, MAX_SECONDS))
        },

        toggleMute() {
            publish({ muted: !state.muted })
        },

        forceStatus(status) {
            // Parked, not ticking: keeps design screenshots deterministic.
            stopTicking()
            endsAt = 0
            publish(DEV_STATES[status])
        },
    }
}

/**
 * The singleton the app uses. `createMockRuntime` is exported for tests, which
 * need isolated instances rather than shared state.
 */
export const mockRuntime = createMockRuntime()

export { createMockRuntime }
