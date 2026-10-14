/**
 * The disc: the face's circle, and the shadow cast into it from the rim.
 *
 * The shadow is what draws the disc's edge now — there is no outline — so the
 * disc reads as a shallow recess that the ticks straddle. Like the readout
 * disc's shadow (`CenterReadout`) it is an SVG filter rather than a
 * `box-shadow`, and none of it depends on state, so it is built once at module
 * load and reused (`rendering-hoist-jsx`).
 */

import { DIAL_CENTER_X, DIAL_CENTER_Y, DISC_INNER_SHADOW, DISC_INNER_SHADOW_ID, DISC_RADIUS } from '../../lib/dial'
import styles from './TimerFace.module.css'

export const DISC = (
    <>
        <defs>
            {/*
             * An offset copy of the disc is subtracted from the disc, which
             * leaves the shadow inside the rim on the side the offset moves
             * away from — the top, since the light is above. The region is
             * widened so the blur is not clipped at the rim.
             */}
            <filter
                id={DISC_INNER_SHADOW_ID}
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
                // sRGB keeps the colour predictable; the SVG default is linearRGB.
                colorInterpolationFilters="sRGB"
            >
                <feGaussianBlur in="SourceAlpha" stdDeviation={DISC_INNER_SHADOW.blur} result="blur" />
                <feOffset in="blur" dy={DISC_INNER_SHADOW.offsetY} result="offsetBlur" />
                <feComposite in="SourceAlpha" in2="offsetBlur" operator="out" result="shaded" />
                <feFlood style={{ floodColor: 'var(--disc-inner-shadow)' }} result="color" />
                <feComposite in="color" in2="shaded" operator="in" />
            </filter>
        </defs>
        <circle className={styles.disc} cx={DIAL_CENTER_X} cy={DIAL_CENTER_Y} r={DISC_RADIUS} />
        <circle
            className={styles.discInnerShadow}
            cx={DIAL_CENTER_X}
            cy={DIAL_CENTER_Y}
            r={DISC_RADIUS}
            filter={`url(#${DISC_INNER_SHADOW_ID})`}
        />
    </>
)
