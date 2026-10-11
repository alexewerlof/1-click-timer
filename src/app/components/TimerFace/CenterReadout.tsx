import {
    DIAL_CENTER_X,
    DIAL_CENTER_Y,
    READOUT_DISC_RADIUS,
    READOUT_FONT_SIZE,
    READOUT_SHADOW,
    READOUT_SHADOW_ID,
} from '../../lib/dial'
import { formatClock } from '../../lib/time'
import type { TimerStatus } from '../../runtime/types'
import styles from './TimerFace.module.css'

interface CenterReadoutProps {
    status: TimerStatus
    remainingSeconds: number
}

/**
 * The readout, centred in the readout disc. The size is derived from the disc
 * radius, so the text cannot grow past the circle it sits in.
 *
 * An idle timer has no remaining time to report, so the text is left blank
 * rather than standing at `0:00`. The disc stays, so the centre keeps its
 * layer.
 *
 * Otherwise it shows the real remaining time: the previewed duration is drawn
 * as a numeral at the end of the preview arc instead (AGENTS.md "Preview
 * numeral").
 */
export function CenterReadout({ status, remainingSeconds }: CenterReadoutProps) {
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
            {status === 'idle' ? null : (
                <text
                    className={styles.readout}
                    style={{ fontSize: READOUT_FONT_SIZE }}
                    x={DIAL_CENTER_X}
                    y={DIAL_CENTER_Y}
                >
                    {formatClock(remainingSeconds)}
                </text>
            )}
        </g>
    )
}
