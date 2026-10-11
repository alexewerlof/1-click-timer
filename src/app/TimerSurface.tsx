import { useEffect } from 'react'
import { TimerApp } from './TimerApp'
import { primeAudio } from './lib/chimes'
import type { Surface } from './lib/surface'
import type { SettingsStore } from './runtime/settings'
import type { TimerRuntime } from './runtime/types'
import { useAlarmSound } from './runtime/useAlarmSound'

export interface TimerSurfaceProps {
    surface: Surface
    runtime: TimerRuntime
    settingsStore: SettingsStore
}

/**
 * Wires the settings-driven behaviour — the alarm chime, and priming the audio
 * context on the first interaction so a later alarm can ring — around the pure
 * presentation in `TimerApp`, which keeps taking only the runtime it renders.
 */
export function TimerSurface({ surface, runtime, settingsStore }: TimerSurfaceProps) {
    useAlarmSound(runtime, settingsStore)
    usePrimeAudio()
    return <TimerApp surface={surface} runtime={runtime} />
}

/** Resumes the audio context on the first interaction, so a later alarm can ring. */
function usePrimeAudio(): void {
    useEffect(() => {
        const prime = () => primeAudio()
        window.addEventListener('pointerdown', prime, { once: true })
        window.addEventListener('keydown', prime, { once: true })
        return () => {
            window.removeEventListener('pointerdown', prime)
            window.removeEventListener('keydown', prime)
        }
    }, [])
}
