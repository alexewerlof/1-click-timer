import { DIAL_CENTER_X, DIAL_CENTER_Y, DISC_RADIUS, MINUTES_PER_TURN, remainingArcPath } from '../../lib/dial'
import { SECONDS_PER_MINUTE } from '../../lib/time'
import styles from './TimerFace.module.css'

interface PreviewArcProps {
    previewMinutes: number | null
}

/**
 * The preview arc: an unfilled outline from 12 o'clock to the minute currently
 * under the pointer, showing what a click would start. Unfilled, unlike the
 * remaining sector (MANUAL "UI elements").
 */
export function PreviewArc({ previewMinutes }: PreviewArcProps) {
    if (previewMinutes === null || previewMinutes <= 0) return null

    // A whole turn is a full circle — an arc cannot close on itself, and
    // returning no path would make the arc vanish exactly where the pointer
    // asks for the longest timer. The remaining sector draws the same shape.
    if (previewMinutes >= MINUTES_PER_TURN) {
        return <circle className={styles.previewArc} cx={DIAL_CENTER_X} cy={DIAL_CENTER_Y} r={DISC_RADIUS} />
    }

    const path = remainingArcPath(previewMinutes * SECONDS_PER_MINUTE)
    if (!path) return null

    return <path className={styles.previewArc} d={path} />
}
