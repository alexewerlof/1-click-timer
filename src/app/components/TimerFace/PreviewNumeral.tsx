import { NUMERAL_RADIUS, pointOnDial } from '../../lib/dial'
import styles from './TimerFace.module.css'

interface PreviewNumeralProps {
    /** The minute the preview arc points at, from 1 to 60. */
    minutes: number
}

/**
 * The previewed minute, drawn on the numeral ring at the end of the preview arc:
 * the numerals' shape, but in the remaining sector's colour, so it reads as the
 * arc's own label rather than another numeral.
 *
 * While previewing it is the *only* numeral on the face: the whole ring is
 * hidden, because showing 0, 5, … 55 beside it would compete with the one number
 * that matters (AGENTS.md "Preview numeral").
 *
 * `pointOnDial` maps 60 back onto 12 o'clock, so a whole turn is labelled where
 * the 0 numeral sits.
 */
export function PreviewNumeral({ minutes }: PreviewNumeralProps) {
    const position = pointOnDial(minutes, NUMERAL_RADIUS)
    return (
        <text className={`${styles.numeral} ${styles.previewNumeral}`} x={position.x} y={position.y}>
            {minutes}
        </text>
    )
}
