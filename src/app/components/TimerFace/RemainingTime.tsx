import { remainingSectorPath } from '../../lib/dial'
import styles from './TimerFace.module.css'

interface RemainingTimeProps {
    seconds: number
    /** A paused timer keeps the same shape, but recedes. */
    active: boolean
}

/**
 * The remaining sector: the filled annular wedge from 12 o'clock counter-clockwise
 * to the current remaining time. Its inner edge is a circle — the readout disc's
 * rim — rather than a sharp corner reaching the centre, so the shape is what is
 * seen and the readout disc no longer has to be painted over a hidden corner. Its
 * size is the time left. Nothing is drawn once the time is up, and a whole turn is
 * a ring rather than a full disc (AGENTS.md "Remaining sector").
 */
export function RemainingTime({ seconds, active }: RemainingTimeProps) {
    const path = remainingSectorPath(seconds)
    if (!path) return null

    return <path className={styles.sector} d={path} data-active={active} />
}
