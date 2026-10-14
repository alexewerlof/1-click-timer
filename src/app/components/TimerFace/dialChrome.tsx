/**
 * The dial's static chrome: every tick, and the numeral ring that a preview
 * replaces.
 *
 * The dial re-renders several times a second while running, but none of this
 * depends on state — so it is built once at module load and reused
 * (`rendering-hoist-jsx`, `js-cache-function-results`).
 *
 * Ticks and numerals are separate exports because the face fades the whole
 * numeral ring out while a duration is previewed, leaving the single preview
 * numeral as the only number on it (see `PreviewNumeral`). The tick element
 * itself lives in `Tick.tsx`, so `PreviewTicks` can redraw the covered ticks
 * without duplicating it.
 */

import { DIAL_TICKS as TICK_GEOMETRY, NUMERAL_MINUTES, NUMERAL_RADIUS, pointOnDial } from '../../lib/dial'
import { Tick } from './Tick'
import styles from './TimerFace.module.css'

function renderNumerals() {
    return NUMERAL_MINUTES.map((minute) => {
        const position = pointOnDial(minute, NUMERAL_RADIUS)
        return (
            // `data-numeral-minutes` is how a click on this numeral is resolved
            // to a duration: a numeral sits off the disc, so the pointer's
            // position cannot tell which one it is (see `TimerFace.handleClick`).
            <text key={minute} className={styles.numeral} x={position.x} y={position.y} data-numeral-minutes={minute}>
                {minute}
            </text>
        )
    })
}

export const DIAL_TICKS = (
    <g data-dial-ticks>
        {TICK_GEOMETRY.map((tick) => (
            <Tick key={tick.minute} tick={tick} />
        ))}
    </g>
)

export const DIAL_NUMERALS = (
    <g data-dial-numerals className={styles.numeralRing}>
        {renderNumerals()}
    </g>
)
