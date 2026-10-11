/**
 * The contract between the timer UI and whatever is actually keeping time.
 *
 * Phase 1 implements this with an in-memory mock so the UI can be designed in
 * a plain browser. Phase 3 implements the same contract on top of
 * `chrome.storage` + `chrome.runtime` messaging, and swaps it in behind
 * `runtime/runtime.ts` — no component changes required.
 */

export type TimerStatus = 'idle' | 'running' | 'paused' | 'expired'

export interface TimerState {
    status: TimerStatus
    /** Fractional seconds, so the dial animates smoothly between ticks. */
    remainingSeconds: number
    /** The duration this countdown was started with. `0` when idle. */
    durationSeconds: number
    muted: boolean
    /** `null` after a reset — the restart button has nothing to restore. */
    lastDurationSeconds: number | null
}

export type TimerStateListener = (state: TimerState) => void

export interface TimerRuntime {
    /** Must return a stable object identity until the state actually changes. */
    getState(): TimerState
    /** Returns an unsubscribe function. */
    subscribe(listener: TimerStateListener): () => void
    start(seconds: number): void
    pause(): void
    resume(): void
    /** Stop and resume are the same control (see MANUAL "Stop a timer"). */
    togglePause(): void
    /** Stops ticking, zeroes the remaining time and forgets the last duration. */
    reset(): void
    /** Re-runs the last duration. No-op when there is none to restore. */
    restart(): void
    toggleMute(): void
}

/**
 * Affordances the design harness uses to park the UI in a given state.
 * Deliberately *not* part of `TimerRuntime` — the Chrome runtime never has it.
 */
export interface TimerDevControls {
    forceStatus(status: TimerStatus): void
}
