import { Expand, Maximize, TimerOff, Volume2, VolumeX } from 'lucide-react'
import type { Surface } from '../../lib/surface'
import type { TimerStatus } from '../../runtime/types'
import styles from './TransportControls.module.css'

/** Matches the visual weight of the 34px tap target. */
const ICON_SIZE = 18

export interface TransportControlsProps {
    status: TimerStatus
    muted: boolean
    surface: Surface
    onToggleMute: () => void
    onReset: () => void
    onToggleFullscreen: () => void
}

/** Mute, reset and the fullscreen button (MANUAL "How to"). Pause/resume and restart live on the readout disc (`ReadoutControl`). */
export function TransportControls({
    status,
    muted,
    surface,
    onToggleMute,
    onReset,
    onToggleFullscreen,
}: TransportControlsProps) {
    const fullscreenLabel = surface === 'popup' ? 'Open in a tab' : 'Full screen'

    return (
        <div className={styles.bar} role="group" aria-label="Timer controls">
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
                <TimerOff size={ICON_SIZE} />
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
