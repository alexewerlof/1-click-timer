/**
 * The static dial chrome: every tick and every numeral.
 *
 * The dial re-renders several times a second while running, but none of this
 * depends on state — so it is built once at module load and reused
 * (`rendering-hoist-jsx`, `js-cache-function-results`).
 */

import { DIAL_TICKS, NUMERAL_MINUTES, NUMERAL_RADIUS, pointOnDial } from '../../lib/dial'
import styles from './TimerFace.module.css'

function renderTicks() {
    return DIAL_TICKS.map((tick) => (
        <line
            key={tick.minute}
            className={tick.major ? styles.tickMajor : styles.tickMinor}
            x1={tick.inner.x}
            y1={tick.inner.y}
            x2={tick.outer.x}
            y2={tick.outer.y}
        />
    ))
}

function renderNumerals() {
    return NUMERAL_MINUTES.map((minute) => {
        const position = pointOnDial(minute, NUMERAL_RADIUS)
        return (
            <text key={minute} className={styles.numeral} x={position.x} y={position.y}>
                {minute}
            </text>
        )
    })
}

export const DIAL_CHROME = (
    <g data-dial-chrome>
        {renderTicks()}
        {renderNumerals()}
    </g>
)
