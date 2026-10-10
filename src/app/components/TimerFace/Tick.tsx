import type { DialTick } from '../../lib/dial'
import styles from './TimerFace.module.css'

interface TickProps {
    tick: DialTick
    /** Extra class, e.g. the preview's colour. */
    className?: string
}

/**
 * One tick of the dial. Shared by the dial's own ring and the preview overlay,
 * so the two cannot drift apart.
 */
export function Tick({ tick, className }: TickProps) {
    const base = tick.major ? styles.tickMajor : styles.tickMinor
    return (
        <line
            className={className ? `${base} ${className}` : base}
            x1={tick.inner.x}
            y1={tick.inner.y}
            x2={tick.outer.x}
            y2={tick.outer.y}
        />
    )
}
