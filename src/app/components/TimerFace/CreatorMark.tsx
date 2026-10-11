import {
    CREATOR_MARK_HEIGHT,
    CREATOR_MARK_VIEWBOX,
    CREATOR_MARK_WIDTH,
    CREATOR_MARK_X,
    CREATOR_MARK_Y,
} from '../../lib/dial'
import styles from './TimerFace.module.css'

/**
 * The creator mark (MANUAL "Creator mark"): the Alex Ewerlöf wordmark, sitting in
 * the band between the readout disc and the 0 numeral, where a watch carries its
 * maker's name.
 *
 * It is *filled* in the dial's ink — the same `--dial-mark` the numerals and ticks
 * use (see `.creatorMark`) — so the Settings screen recolours it with them. Filled
 * rather than stroked: the source is a hairline outline, and the popup's face is
 * too small for a stroke to survive.
 *
 * The art is inlined rather than imported, so it can take its colour from the
 * dial. Only the source's own structure is kept — its two group transforms and its
 * seven per-shape translates, with the path data verbatim — minus its metadata, its
 * (no-op) clip path and its hard-coded colours. The nested `viewBox` is the art's
 * own canvas, and 25 units of padding sit on every side, so a mark at the box's
 * edge cannot be clipped by the nested viewport.
 */
export function CreatorMark() {
    return (
        <svg
            className={styles.creatorMark}
            x={CREATOR_MARK_X}
            y={CREATOR_MARK_Y}
            width={CREATOR_MARK_WIDTH}
            height={CREATOR_MARK_HEIGHT}
            viewBox={CREATOR_MARK_VIEWBOX}
            aria-hidden="true"
            focusable="false"
        >
            <g transform="matrix(1.3333333 0 0 -1.3333333 0 800)">
                <g transform="matrix(0.98167542 0 0 0.98167542 -205.17017 211.74773)">
                    <g transform="translate(396.1797 361.1191)">
                        <path d="m 0,0 c 0,-8.443 -6.834,-15.279 -15.278,-15.279 -8.442,0 -15.282,6.836 -15.282,15.279 0,8.442 6.84,15.28 15.282,15.28 C -6.834,15.28 0,8.442 0,0" />
                    </g>
                    <g transform="translate(434.3813 361.1182)">
                        <path d="m 0,0 c 0,-8.442 -6.833,-15.28 -15.281,-15.28 -8.439,0 -15.279,6.838 -15.279,15.28 0,8.441 6.84,15.279 15.279,15.279 C -6.833,15.279 0,8.441 0,0" />
                    </g>
                    <g transform="translate(311.9165 300)">
                        <path d="m 0,0 h -73.904 l 19.341,-30.561 h 72.001 z" />
                    </g>
                    <g transform="translate(471.4883 269.4395)">
                        <path d="M 0,0 H 71.157 L 90.5,30.561 H 18.278 Z" />
                    </g>
                    <g transform="translate(338.0742 254.1592)">
                        <path d="m 0,0 h -71.049 l 19.343,-30.559 h 69.144 z" />
                    </g>
                    <g transform="translate(444.0698 223.6006)">
                        <path d="M 0,0 H 69.562 L 88.905,30.559 H 18.279 Z" />
                    </g>
                    <g transform="translate(320.791 315.2803)">
                        <path d="M 0,0 52.158,-91.404 79.209,-46.188 105.951,-90.887 160.312,0 h 90.554 l 19.343,30.56 H 142.979 L 105.947,-31.355 79.209,13.336 52.78,-30.837 17.746,30.56 H -111.791 L -92.448,0 Z" />
                    </g>
                </g>
            </g>
        </svg>
    )
}
