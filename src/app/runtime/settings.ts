/**
 * The settings the user can change (AGENTS.md "Settings"), and the contract the UI
 * talks to about them.
 *
 * The store is deliberately separate from `TimerRuntime`: settings are user
 * preferences that persist and sync, while timer state is the running countdown.
 * Both follow the same `getState` / `subscribe` shape so the UI binds to them
 * the same way.
 */

import { DEFAULT_ALARM_SECONDS, isAlarmSeconds, type AlarmSeconds } from '../lib/alarm'
import { CHIME_OPTIONS, DEFAULT_CHIME, type ChimeId } from '../lib/chimes'

/** Light, dark, or follow the OS preference (the default). */
export type ThemeMode = 'light' | 'dark' | 'device'

export const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'device']

/** How the remaining time is coloured: the badge's ramp, or a colour pinned flat. */
export type RemainingColor = 'gradient' | 'red' | 'green'

export const REMAINING_COLORS: readonly RemainingColor[] = ['gradient', 'red', 'green']

export interface TimerSettings {
    mode: ThemeMode
    /** Alarm volume, 0..1. Maxed by default (AGENTS.md "Settings"). */
    volume: number
    chime: ChimeId
    /** How long the alarm rings for, in seconds (AGENTS.md "Notification"). */
    alarmSeconds: AlarmSeconds
    /**
     * The remaining indicator's colour. `gradient` (the default) follows the time
     * left through the toolbar badge's own ramp; `red` and `green` pin it flat.
     */
    remaining: RemainingColor
}

export const DEFAULT_SETTINGS: TimerSettings = {
    mode: 'device',
    volume: 1,
    chime: DEFAULT_CHIME,
    alarmSeconds: DEFAULT_ALARM_SECONDS,
    remaining: 'gradient',
}

/** The key settings live under, in `chrome.storage.sync` (local fallback). */
export const SETTINGS_STORAGE_KEY = 'settings'

export type SettingsListener = (settings: TimerSettings) => void

export interface SettingsStore {
    /** Must return a stable object identity until the settings actually change. */
    getState(): TimerSettings
    /** Returns an unsubscribe function. */
    subscribe(listener: SettingsListener): () => void
    update(patch: Partial<TimerSettings>): void
    /** Restores the factory settings (AGENTS.md "Settings"). */
    reset(): void
}

/** Clamps an arbitrary value into the 0..1 volume range. */
export function clampVolume(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_SETTINGS.volume
    return Math.min(1, Math.max(0, value))
}

export function isThemeMode(value: unknown): value is ThemeMode {
    return typeof value === 'string' && (THEME_MODES as readonly string[]).includes(value)
}

export function isRemainingColor(value: unknown): value is RemainingColor {
    return typeof value === 'string' && (REMAINING_COLORS as readonly string[]).includes(value)
}

function isChime(value: unknown): value is ChimeId {
    return CHIME_OPTIONS.some((option) => option.id === value)
}

/** The stored alarm length, coerced onto the offered menu. */
function alarmSecondsOr(value: unknown): AlarmSeconds {
    return isAlarmSeconds(value) ? value : DEFAULT_SETTINGS.alarmSeconds
}

/** Coerces anything read from storage into a complete, valid settings object. */
export function normalizeSettings(raw: unknown): TimerSettings {
    const source = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
    return {
        mode: isThemeMode(source.mode) ? source.mode : DEFAULT_SETTINGS.mode,
        volume: clampVolume(source.volume),
        chime: isChime(source.chime) ? source.chime : DEFAULT_SETTINGS.chime,
        alarmSeconds: alarmSecondsOr(source.alarmSeconds),
        remaining: isRemainingColor(source.remaining) ? source.remaining : DEFAULT_SETTINGS.remaining,
    }
}

/**
 * The shared implementation behind every `SettingsStore`: it owns the current
 * value and the listener set, and delegates persistence and external changes to
 * the caller. The mock and the chrome store differ only in those two.
 */
export interface SettingsController extends SettingsStore {
    /** Applies settings that arrived from storage, without persisting them back. */
    receive(settings: unknown): void
}

export function createSettingsController(
    initial: TimerSettings,
    persist: (settings: TimerSettings) => void,
): SettingsController {
    let state = initial
    const listeners = new Set<SettingsListener>()

    function publish(next: TimerSettings): void {
        state = next
        for (const listener of listeners) listener(state)
    }

    return {
        getState: () => state,

        subscribe(listener) {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },

        update(patch) {
            const next = normalizeSettings({ ...state, ...patch })
            publish(next)
            persist(next)
        },

        reset() {
            publish(DEFAULT_SETTINGS)
            persist(DEFAULT_SETTINGS)
        },

        receive(next) {
            publish(normalizeSettings(next))
        },
    }
}
