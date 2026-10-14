import { useSyncExternalStore } from 'react'
import type { TimerRuntime, TimerState } from './types'

/** Subscribes a component to the runtime without duplicating its state. */
export function useTimerState(runtime: TimerRuntime): TimerState {
    return useSyncExternalStore(runtime.subscribe, runtime.getState, runtime.getState)
}
