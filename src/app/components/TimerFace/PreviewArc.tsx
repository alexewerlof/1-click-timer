import { remainingArcPath } from '../../lib/dial'
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

    const path = remainingArcPath(previewMinutes * SECONDS_PER_MINUTE)
    if (!path) return null

    return <path className={styles.previewArc} d={path} />
}
