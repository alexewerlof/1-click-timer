import { SECONDS_PER_MINUTE } from '../../lib/time'
import type { TimerPreset } from '../../runtime/types'
import styles from './PresetBar.module.css'

interface PresetBarProps {
    presets: readonly TimerPreset[]
    /** Duration currently counting down, in seconds (`0` while idle). */
    activeSeconds: number
    onPick: (seconds: number) => void
}

/** Pre-configured timers (MANUAL "Set a pre-configured timer"). */
export function PresetBar({ presets, activeSeconds, onPick }: PresetBarProps) {
    return (
        <div className={styles.bar} role="group" aria-label="Presets">
            {presets.map((preset) => {
                const seconds = preset.minutes * SECONDS_PER_MINUTE
                const active = activeSeconds === seconds
                return (
                    <button
                        key={preset.id}
                        type="button"
                        className={styles.preset}
                        data-active={active}
                        aria-pressed={active}
                        title={`${preset.minutes} minutes`}
                        onClick={() => onPick(seconds)}
                    >
                        {preset.label}
                    </button>
                )
            })}
        </div>
    )
}
