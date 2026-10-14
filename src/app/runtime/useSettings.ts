import { useSyncExternalStore } from 'react'
import type { SettingsStore, TimerSettings } from './settings'

/** Subscribes a component to the settings store without duplicating its state. */
export function useSettings(store: SettingsStore): TimerSettings {
    return useSyncExternalStore(store.subscribe, store.getState, store.getState)
}
