import { useEffect } from 'react'
import { remainingColorFor } from '../../shared/remainingColor'
import { accentColorFor, fixedRemainingColor } from '../design/palette'
import type { SettingsStore } from './settings'
import type { TimerState } from './types'
import { useSettings } from './useSettings'

/**
 * Publishes the dial's three colours as custom properties on `<html>`, from the
 * “Remaining” choice in the settings:
 *
 * - `--remaining` — the live colour of the sector and the readout control. Red
 *   and Green pin it for the whole timer; Gradient tracks the time left through
 *   the same ramp the toolbar badge uses (`shared/remainingColor.ts`), so the
 *   badge and the dial always read the same moment the same way; Conic paints the
 *   sweep from the duration instead, so this is only the readout control's colour.
 * - `--preview` — the colour a click would start: the preview arc, its numeral,
 *   its ticks and the numeral hover. It never follows the live colour, so a
 *   paused (grey) timer still previews in colour.
 * - `--accent` — the interactive signal: the controls' hover and focus colour.
 *   It stays the theme's red under Gradient and Conic and turns the calm green
 *   under Red or Green, so it never follows the ramp — and never the grey of a
 *   pause.
 *
 * Red and Green take their chosen colour for the first two; Gradient and Conic
 * leave both `--preview` and `--accent` to the theme's red. This is the only
 * writer of the three. `state` is `null` on a surface with no timer (the settings
 * screen), where `--remaining` is cleared so the theme's own colour shows through.
 */
export function useRemainingColor(store: SettingsStore, state: TimerState | null): void {
    const remaining = useSettings(store).remaining
    const status = state?.status ?? null
    const remainingSeconds = state?.remainingSeconds ?? 0
    const durationSeconds = state?.durationSeconds ?? 0

    useEffect(() => {
        const root = document.documentElement

        function apply(property: string, value: string | null): void {
            if (value === null) root.style.removeProperty(property)
            else root.style.setProperty(property, value)
        }

        // Gradient is `null`, so it clears the property and the theme's own red
        // shows — for the preview and the accent outright, and for the live
        // colour until the ramp below replaces it.
        const fixed = fixedRemainingColor(remaining)
        apply('--remaining', fixed)
        apply('--preview', fixed)
        apply('--accent', accentColorFor(remaining))

        if (fixed !== null) return

        // Gradient: the live colour follows the time left. A surface with no
        // timer has nothing to follow, so the theme's colour stands.
        if (status === null) return
        const fraction = durationSeconds > 0 ? remainingSeconds / durationSeconds : 0
        root.style.setProperty('--remaining', remainingColorFor(status, fraction))
    }, [remaining, status, remainingSeconds, durationSeconds])
}
