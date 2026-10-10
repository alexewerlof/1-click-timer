import { useRef, useState } from 'react'
import type {
    KeyboardEvent as ReactKeyboardEvent,
    MouseEvent as ReactMouseEvent,
    PointerEvent as PointerEventType,
} from 'react'
import {
    DIAL_VIEWBOX,
    MINUTES_PER_TURN,
    SHOW_CREATOR_MARK,
    clientPointToDialPoint,
    isPointInsideReadoutDisc,
    isPointOnDisc,
    pointToMinutes,
} from '../../lib/dial'
import type { Point } from '../../lib/dial'
import { SECONDS_PER_MINUTE } from '../../lib/time'
import type { TimerStatus } from '../../runtime/types'
import { Caption } from './Caption'
import { CenterReadout } from './CenterReadout'
import { CreatorMark } from './CreatorMark'
import { DISC } from './Disc'
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

    /** The dial-space point under a client coordinate, or null before layout. */
    function pointAt(clientX: number, clientY: number): Point | null {
        const svg = svgRef.current
        if (!svg) return null
        return clientPointToDialPoint(svg, clientX, clientY)
    }

    /**
     * The whole minute at a dial-space point, clamped to the dial's range — or
     * null when the point is not on the disc, or sits over the readout disc at
     * its centre. The readout disc reads as a layer above the dial, so both
     * hover and click ignore it; off the disc there is nothing to show either.
     */
    function durationAt(point: Point | null): number | null {
        if (!point || !isPointOnDisc(point) || isPointInsideReadoutDisc(point)) return null
        return clampMinutes(Math.round(pointToMinutes(point)))
    }

    function handlePointerMove(event: PointerEventType<SVGSVGElement>) {
        setPreviewMinutes(durationAt(pointAt(event.clientX, event.clientY)))
    }

    function handlePointerLeave() {
        setPreviewMinutes(null)
    }

    function handleClick(event: ReactMouseEvent<SVGSVGElement>) {
        pick(durationAt(pointAt(event.clientX, event.clientY)))
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
            {DISC}
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
