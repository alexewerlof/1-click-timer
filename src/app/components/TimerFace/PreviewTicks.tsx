import { ticksWithinPreview } from '../../lib/dial'
import { Tick } from './Tick'
import styles from './TimerFace.module.css'

interface PreviewTicksProps {
    /** The minute the preview arc points at, from 1 to 60. */
    minutes: number
}

/**
 * The ticks inside the previewed span, redrawn in the remaining sector's colour
 * so the arc, its numeral and the ticks it covers read as one mark.
 *
 * Drawn *over* the dial's own ticks, which are hoisted and never re-rendered:
 * only the covered ticks are stateful. They share `Tick` with the dial, so the
 * two cannot drift apart.
 */
export function PreviewTicks({ minutes }: PreviewTicksProps) {
    return (
        <g data-preview-ticks>
            {ticksWithinPreview(minutes).map((tick) => (
                <Tick key={tick.minute} tick={tick} className={styles.tickPreview} />
            ))}
        </g>
    )
}
