import { CAPTION_PATH, CAPTION_PATH_ID } from '../../lib/dial'
import styles from './TimerFace.module.css'

/** "Made in Sweden", inscribed inside the disc on a circular path (AGENTS.md "Caption"). */
export function Caption() {
    return (
        <g>
            <defs>
                <path id={CAPTION_PATH_ID} d={CAPTION_PATH} />
            </defs>
            <text className={styles.caption}>
                <textPath href={`#${CAPTION_PATH_ID}`} startOffset="50%" textAnchor="middle">
                    Made in Sweden
                </textPath>
            </text>
        </g>
    )
}
