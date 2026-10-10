import {
    DIAL_CENTER_X,
    DIAL_CENTER_Y,
    READOUT_DISC_RADIUS,
    READOUT_FONT_SIZE,
    READOUT_PREVIEW_FONT_SIZE,
    READOUT_SHADOW,
    READOUT_SHADOW_ID,
} from '../../lib/dial'
import { formatClock } from '../../lib/time'
import type { TimerStatus } from '../../runtime/types'
import styles from './TimerFace.module.css'

interface CenterReadoutProps {
    status: TimerStatus
    remainingSeconds: number
    /** Minute under the pointer, if any. */
    hoverMinutes: number | null
}

/**
 * Hovering previews the timer that a click would start (MANUAL "Timer face").
 * While ticking we keep showing the real remaining time instead, because
 * hiding it behind a preview would lose the only information that matters.
 */
function isPreviewing(status: TimerStatus, hoverMinutes: number | null): boolean {
    const previewable = status === 'idle' || status === 'expired'
    return previewable && hoverMinutes !== null
}

/**
 * The readout, centred in the readout disc. Both sizes are derived from the
 * disc radius, so the text cannot grow past the circle it sits in.
 */
export function CenterReadout({ status, remainingSeconds, hoverMinutes }: CenterReadoutProps) {
    const previewing = isPreviewing(status, hoverMinutes)

    return (
        <g>
            <defs>
                {/* Region widened so the blur is not clipped at the disc's edge. */}
                <filter id={READOUT_SHADOW_ID} x="-60%" y="-60%" width="220%" height="220%">
                    <feDropShadow
                        dx="0"
                        dy={READOUT_SHADOW.offsetY}
                        stdDeviation={READOUT_SHADOW.blur}
                        // sRGB keeps the colour predictable; the SVG default is linearRGB.
                        colorInterpolationFilters="sRGB"
                        style={{ floodColor: 'var(--readout-shadow)' }}
                    />
                </filter>
            </defs>
            <circle
                className={styles.readoutDisc}
                cx={DIAL_CENTER_X}
                cy={DIAL_CENTER_Y}
                r={READOUT_DISC_RADIUS}
                filter={`url(#${READOUT_SHADOW_ID})`}
            />
            <text
                className={styles.readout}
                style={{ fontSize: previewing ? READOUT_PREVIEW_FONT_SIZE : READOUT_FONT_SIZE }}
                x={DIAL_CENTER_X}
                y={DIAL_CENTER_Y}
            >
                {previewing ? hoverMinutes : formatClock(remainingSeconds)}
            </text>
        </g>
    )
}
