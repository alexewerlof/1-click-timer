import { useId, type CSSProperties } from 'react'
import { REMAINING_PAUSED } from '../../../shared/remainingColor'
import { conicGradientFor } from '../../design/palette'
import { DIAL_CENTER_X, DIAL_CENTER_Y, DISC_RADIUS, remainingSectorPath } from '../../lib/dial'
import type { RemainingColor } from '../../runtime/settings'
import styles from './TimerFace.module.css'

/** The overlay is the disc's bounding box; the wedge is cut out of it inside. */
const SECTOR_DIAMETER = 2 * DISC_RADIUS

interface RemainingTimeProps {
    seconds: number
    /** A paused timer keeps the same shape, but recedes. */
    active: boolean
    /** The timer's duration — where the Conic sweep's green sits. */
    durationSeconds: number
    /** How the sector is painted (AGENTS.md "Remaining sector"). */
    appearance: RemainingColor
}

/**
 * The remaining sector: the filled annular wedge from 12 o'clock counter-clockwise
 * to the current remaining time. Its inner edge is a circle — the readout disc's
 * rim — rather than a sharp corner reaching the centre, so the shape is what is
 * seen and the readout disc no longer has to be painted over a hidden corner. Its
 * size is the time left. Nothing is drawn once the time is up, and a whole turn is
 * a ring rather than a full disc (AGENTS.md "Remaining sector").
 *
 * Gradient, Red and Green paint it with one flat colour, as an SVG `<path>`. Conic
 * paints it with a fixed green → orange → red sweep, which `fill` cannot take, so
 * it becomes a gradient layer inside a `foreignObject` instead — clipped, not
 * masked, by the very same path (see `ConicSector`).
 */
export function RemainingTime({ seconds, active, durationSeconds, appearance }: RemainingTimeProps) {
    const path = remainingSectorPath(seconds)
    if (!path) return null

    if (appearance === 'conic') {
        return <ConicSector path={path} active={active} durationSeconds={durationSeconds} />
    }

    return <path className={styles.sector} d={path} data-active={active} />
}

interface ConicSectorProps {
    /** The annular wedge's outline, shared with the flat sector. */
    path: string
    active: boolean
    durationSeconds: number
}

/**
 * The sector painted with a fixed sweep instead of one flat colour. It holds the
 * flat `<path>`'s place in the face's paint order, so the ticks still cover it.
 *
 * The sweep is a CSS `conic-gradient`, which SVG `fill` cannot take, so it is
 * painted on an HTML layer inside a `foreignObject`. The wedge's *shape* is that
 * same `path`, applied as an SVG `clipPath` on the `foreignObject` rather than
 * approximated with a gradient mask: a clip is real geometry, so the rasteriser
 * anti-aliases its edges exactly as it does the flat `<path>`, whereas a
 * `conic-gradient` hard stop is a per-pixel colour with no coverage and leaves a
 * hard, stair-stepped edge. The sweep is fixed to the timer's duration and the
 * clip shrinks over it, so the sector reveals the sweep rather than moving it; a
 * pause keeps the clip, greys the sweep and recedes, exactly like the flat
 * colours (AGENTS.md "Remaining sector").
 */
function ConicSector({ path, active, durationSeconds }: ConicSectorProps) {
    // `useId` keeps the clip's id unique, so two faces on one page never share it.
    const clipId = `conic-sector-${useId().replace(/:/g, '')}`
    const style = {
        width: SECTOR_DIAMETER,
        height: SECTOR_DIAMETER,
        '--sector-fill': active ? conicGradientFor(durationSeconds) : REMAINING_PAUSED,
    } as CSSProperties

    return (
        <>
            <defs>
                <clipPath id={clipId}>
                    <path d={path} />
                </clipPath>
            </defs>
            <foreignObject
                className={styles.conicClip}
                x={DIAL_CENTER_X - DISC_RADIUS}
                y={DIAL_CENTER_Y - DISC_RADIUS}
                width={SECTOR_DIAMETER}
                height={SECTOR_DIAMETER}
                clipPath={`url(#${clipId})`}
            >
                <div className={styles.conicSector} data-active={active} style={style} />
            </foreignObject>
        </>
    )
}
