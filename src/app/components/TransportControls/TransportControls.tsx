import { Expand, Maximize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react'
import type { Surface } from '../../lib/surface'
import type { TimerStatus } from '../../runtime/types'
import styles from './TransportControls.module.css'

/** Matches the visual weight of the 34px tap target. */
const ICON_SIZE = 18

export interface TransportControlsProps {
    status: TimerStatus
    muted: boolean
    /** False once a reset has wiped the memory of the last duration. */
    canRestart: boolean
    surface: Surface
    onTogglePause: () => void
    onToggleMute: () => void
    onReset: () => void
    onRestart: () => void
    onToggleFullscreen: () => void
}

/** Pause/resume, mute, reset, restart and the fullscreen button (MANUAL "How to"). */
export function TransportControls({
    status,
    muted,
    canRestart,
    surface,
    onTogglePause,
    onToggleMute,
    onReset,
    onRestart,
    onToggleFullscreen,
}: TransportControlsProps) {
    const running = status === 'running'
    const countable = running || status === 'paused'
    const fullscreenLabel = surface === 'popup' ? 'Open in a tab' : 'Full screen'

    return (
        <div className={styles.bar} role="group" aria-label="Timer controls">
            <button
                type="button"
                className={`${styles.button} ${styles.primary}`}
                onClick={onTogglePause}
                disabled={!countable}
                aria-label={running ? 'Pause' : 'Resume'}
                title={running ? 'Pause' : 'Resume'}
            >
                {running ? <Pause size={ICON_SIZE} /> : <Play size={ICON_SIZE} />}
            </button>

            <button
                type="button"
                className={styles.button}
                onClick={onToggleMute}
                aria-pressed={muted}
                aria-label={muted ? 'Unmute' : 'Mute'}
                title={muted ? 'Unmute' : 'Mute'}
            >
                {muted ? <VolumeX size={ICON_SIZE} /> : <Volume2 size={ICON_SIZE} />}
            </button>

            <button
                type="button"
                className={styles.button}
                onClick={onReset}
                disabled={status === 'idle'}
                aria-label="Reset"
                title="Reset"
            >
                <RotateCcw size={ICON_SIZE} />
            </button>

            <button
                type="button"
                className={styles.button}
                onClick={onRestart}
                disabled={!canRestart}
                aria-label="Restart last timer"
                title="Restart last timer"
            >
                <RotateCw size={ICON_SIZE} />
            </button>

            <button
                type="button"
                className={styles.button}
                onClick={onToggleFullscreen}
                aria-label={fullscreenLabel}
                title={fullscreenLabel}
            >
                {surface === 'popup' ? <Maximize size={ICON_SIZE} /> : <Expand size={ICON_SIZE} />}
            </button>
        </div>
    )
}
