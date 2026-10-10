import { useRef, useState } from 'react'
import type {
    KeyboardEvent as ReactKeyboardEvent,
    MouseEvent as ReactMouseEvent,
    PointerEvent as PointerEventType,
} from 'react'
import {
    DIAL_CENTER_X,
    DIAL_CENTER_Y,
    DISC_RADIUS,
    DIAL_VIEWBOX,
    MINUTES_PER_TURN,
    SHOW_CREATOR_MARK,
    clientPointToMinutes,
} from '../../lib/dial'
import { SECONDS_PER_MINUTE } from '../../lib/time'
import type { TimerStatus } from '../../runtime/types'
import { Caption } from './Caption'
import { CenterReadout } from './CenterReadout'
import { CreatorMark } from './CreatorMark'
import { PreviewArc } from './PreviewArc'
import { RemainingTime } from './RemainingTime'
import { DIAL_CHROME } from './dialChrome'
import styles from './TimerFace.module.css'

/** One-minute steps; hold shift for a five-minute jump. */
const FINE_STEP = 1
const COARSE_STEP = 5

export interface TimerFaceProps {
    status: TimerStatus
    remainingSeconds: number
    /** Receives the chosen duration in seconds. */
    onPick: (seconds: number) => void
}

function clampMinutes(minutes: number): number {
    return Math.min(MINUTES_PER_TURN, Math.max(0, minutes))
}

/**
 * The face: hover or click the dial to set a timer (MANUAL "Set a custom
 * timer").
 *
 * Exposed as a slider so the same action is reachable from the keyboard —
 * arrows move counter-clockwise (more time) and clockwise (less time), shift
 * jumps by five, Enter sets the timer.
 */
export function TimerFace({ status, remainingSeconds, onPick }: TimerFaceProps) {
    const svgRef = useRef<SVGSVGElement>(null)
    const [previewMinutes, setPreviewMinutes] = useState<number | null>(null)

    function minutesAt(clientX: number, clientY: number): number | null {
        const svg = svgRef.current
        if (!svg) return null
        return clampMinutes(Math.round(clientPointToMinutes(svg, clientX, clientY)))
    }

    function handlePointerMove(event: PointerEventType<SVGSVGElement>) {
        setPreviewMinutes(minutesAt(event.clientX, event.clientY))
    }

    function handlePointerLeave() {
        setPreviewMinutes(null)
    }

    function handleClick(event: ReactMouseEvent<SVGSVGElement>) {
        pick(minutesAt(event.clientX, event.clientY))
    }

    function handleKeyDown(event: ReactKeyboardEvent<SVGSVGElement>) {
        const step = event.shiftKey ? COARSE_STEP : FINE_STEP
        const current = previewMinutes ?? 0

        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                setPreviewMinutes(clampMinutes(current + step))
                break
            case 'ArrowRight':
            case 'ArrowDown':
                setPreviewMinutes(clampMinutes(current - step))
                break
            case 'Home':
                setPreviewMinutes(0)
                break
            case 'End':
                setPreviewMinutes(MINUTES_PER_TURN)
                break
            case 'Enter':
            case ' ':
                pick(previewMinutes)
                break
            default:
                return
        }

        event.preventDefault()
    }

    function pick(minutes: number | null) {
        if (minutes === null || minutes <= 0) return
        onPick(minutes * SECONDS_PER_MINUTE)
    }

    return (
        <svg
            ref={svgRef}
            className={styles.face}
            viewBox={DIAL_VIEWBOX}
            role="slider"
            tabIndex={0}
            aria-label="Timer duration"
            aria-valuemin={0}
            aria-valuemax={MINUTES_PER_TURN}
            aria-valuenow={previewMinutes ?? 0}
            aria-valuetext={previewMinutes === null ? 'No duration selected' : `${previewMinutes} minutes`}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
        >
            <circle className={styles.disc} cx={DIAL_CENTER_X} cy={DIAL_CENTER_Y} r={DISC_RADIUS} />
            {DIAL_CHROME}
            {/*
             * The remaining sector sits *over* the chrome and is slightly
             * translucent, so it tints the ticks it swallows — the way the
             * plastic overlay on a physical timer does.
             */}
            <RemainingTime seconds={remainingSeconds} active={status === 'running'} />
            <PreviewArc previewMinutes={previewMinutes} />
            <CenterReadout status={status} remainingSeconds={remainingSeconds} hoverMinutes={previewMinutes} />
            {SHOW_CREATOR_MARK ? <CreatorMark /> : null}
            <Caption />
        </svg>
    )
}
