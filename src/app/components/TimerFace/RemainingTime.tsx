import { DIAL_CENTER_X, DIAL_CENTER_Y, DISC_RADIUS, remainingSectorPath } from '../../lib/dial'
import { MAX_SECONDS } from '../../lib/time'
import styles from './TimerFace.module.css'

interface RemainingTimeProps {
    seconds: number
    /** A paused timer keeps the same shape, but recedes. */
    active: boolean
}

/**
 * The remaining sector: the filled wedge from 12 o'clock counter-clockwise to
 * the current remaining time, reaching the centre. Its size is the time left.
 * Nothing is drawn once the time is up (MANUAL "UI elements").
 */
export function RemainingTime({ seconds, active }: RemainingTimeProps) {
    // A whole turn is a full disc — an arc cannot close on itself.
    if (seconds >= MAX_SECONDS) {
        return (
            <circle
                className={styles.sector}
                cx={DIAL_CENTER_X}
                cy={DIAL_CENTER_Y}
                r={DISC_RADIUS}
                data-active={active}
            />
        )
    }

    const path = remainingSectorPath(seconds)
    if (!path) return null

    return <path className={styles.sector} d={path} data-active={active} />
}
