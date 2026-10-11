import type { CSSProperties } from 'react'
import { Pause, Play, TimerReset } from 'lucide-react'
import { READOUT_DISC_DIAMETER_RATIO } from '../../lib/dial'
import type { TimerStatus } from '../../runtime/types'
import styles from './TimerFace.module.css'

interface ReadoutControlProps {
    status: TimerStatus
    /** Stop or resume the running timer (AGENTS.md "Stop a timer"). */
    onTogglePause: () => void
    /** Re-run the last duration while the alarm is ringing (AGENTS.md "Restart the timer"). */
    onRestart: () => void
}

interface ReadoutAction {
    label: string
    Icon: typeof Pause
    run: () => void
}

/**
 * What the control offers in a given state, or null when it has nothing to
 * offer. Stop and resume are the same thing, so one control serves both (AGENTS.md
 * "Stop a timer"); an idle timer has none, and the ringing state offers a
 * restart instead (AGENTS.md "Restart the timer").
 */
function actionFor(status: TimerStatus, onTogglePause: () => void, onRestart: () => void): ReadoutAction | null {
    switch (status) {
        case 'running':
            return { label: 'Pause', Icon: Pause, run: onTogglePause }
        case 'paused':
            return { label: 'Resume', Icon: Play, run: onTogglePause }
        case 'expired':
            return { label: 'Restart timer', Icon: TimerReset, run: onRestart }
        default:
            return null
    }
}

/**
 * The control on the readout disc: a round button whose click surface is the
 * whole disc, revealed when the disc is hovered (or the button focused) and
 * wearing the remaining sector's colour. While it shows, the readout hides, so
 * it reads as replacing the number.
 *
 * It is a real HTML `<button>` overlaid on the face rather than an SVG element:
 * a `<button>` is not valid in the SVG namespace, and nesting a focusable button
 * inside the face's `role="slider"` would make the accessibility tree ambiguous.
 *
 * Its size is the disc's diameter — `--readout-disc-ratio` comes from `dial.ts`
 * and the face's rendered side is `cqmin` (see `.stage` in `TimerFace.module.css`).
 */
export function ReadoutControl({ status, onTogglePause, onRestart }: ReadoutControlProps) {
    const action = actionFor(status, onTogglePause, onRestart)
    if (!action) return null

    const { label, Icon, run } = action

    return (
        <button
            type="button"
            className={styles.readoutControl}
            style={{ '--readout-disc-ratio': READOUT_DISC_DIAMETER_RATIO } as CSSProperties}
            onClick={run}
            aria-label={label}
            title={label}
        >
            <Icon aria-hidden />
        </button>
    )
}
