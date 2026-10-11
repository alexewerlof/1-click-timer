import { useEffect } from 'react'
import { startChime } from '../lib/chimes'
import type { SettingsStore } from './settings'
import type { TimerRuntime } from './types'
import { useSettings } from './useSettings'
import { useTimerState } from './useTimerState'

/**
 * Rings the chosen chime while the timer is ringing (AGENTS.md "Notification"):
 * from the moment the status becomes `expired` until it leaves that state
 * (restart, reset or pause). Muted and the Silent chime both ring nothing.
 */
export function useAlarmSound(runtime: TimerRuntime, settingsStore: SettingsStore): void {
    const state = useTimerState(runtime)
    const settings = useSettings(settingsStore)
    const ringing = state.status === 'expired' && !state.muted

    useEffect(() => {
        if (!ringing || settings.chime === 'silent') return
        return startChime(settings.chime, settings.volume)
    }, [ringing, settings.chime, settings.volume])
}
