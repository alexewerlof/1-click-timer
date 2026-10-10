import logoUrl from '../../../images/logo128.png'
import { DIAL_CENTER_X } from '../../lib/dial'
import styles from './TimerFace.module.css'

/**
 * Logo and creator name, sitting in the band between the centre circle and the
 * 0 indicator (MANUAL "Timer face"): present for the curious, never dominant.
 */
export function CreatorMark() {
    return (
        <g className={styles.creatorMark}>
            <image href={logoUrl} x={DIAL_CENTER_X - 2.9} y={34} width={5.8} height={5.8} />
            <text className={styles.creatorName} x={DIAL_CENTER_X} y={43.5}>
                Alex Ewerlöf
            </text>
        </g>
    )
}
