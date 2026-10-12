import { useRef, useState } from 'react'
import type {
    KeyboardEvent as ReactKeyboardEvent,
    MouseEvent as ReactMouseEvent,
    PointerEvent as PointerEventType,
} from 'react'
import {
    DIAL_VIEWBOX,
    MINUTES_PER_TURN,
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
import { PreviewNumeral } from './PreviewNumeral'
import { PreviewTicks } from './PreviewTicks'
import { ReadoutControl } from './ReadoutControl'
import { RemainingTime } from './RemainingTime'
import { DIAL_NUMERALS, DIAL_TICKS } from './dialChrome'
import styles from './TimerFace.module.css'

/** One-minute steps; hold shift for a five-minute jump. */
const FINE_STEP = 1
const COARSE_STEP = 5

export interface TimerFaceProps {
    status: TimerStatus
    remainingSeconds: number
    /** Receives the chosen duration in seconds. */
    onPick: (seconds: number) => void
    /** Stop or resume the timer, from the control on the readout disc. */
    onTogglePause: () => void
    /** Re-run the last duration, from the control shown while ringing. */
    onRestart: () => void
}

function clampMinutes(minutes: number): number {
    return Math.min(MINUTES_PER_TURN, Math.max(0, minutes))
}

/**
 * The face: hover or click the dial to set a timer, or click a numeral to start
 * that many minutes outright — the 0 numeral, which marks a whole turn, starts
 * 60 (AGENTS.md "Set a custom timer").
 *
 * Exposed as a slider so the disc action is reachable from the keyboard —
 * arrows move counter-clockwise (more time) and clockwise (less time), shift
 * jumps by five, Enter sets the timer.
 *
 * The readout disc carries its own control (`ReadoutControl`), a real HTML button
 * overlaid on the face rather than drawn in it.
 */
export function TimerFace({ status, remainingSeconds, onPick, onTogglePause, onRestart }: TimerFaceProps) {
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

    /**
     * The duration in minutes of the numeral a click landed on, or null when it
     * did not land on one. Read from `data-numeral-minutes` rather than the
     * pointer's position, because a numeral sits outside the disc (see
     * `dialChrome`).
     *
     * The 0 numeral marks a whole turn: it sits where the preview numeral shows
     * 60 (AGENTS.md "Preview numeral"), so it starts 60 minutes rather than the
     * nothing a 0-minute timer would be.
     */
    function numeralDurationAt(target: EventTarget | null): number | null {
        if (!(target instanceof Element)) return null
        const label = target.closest('[data-numeral-minutes]')?.getAttribute('data-numeral-minutes')
        if (label === null || label === undefined) return null
        const minutes = Number(label)
        return minutes === 0 ? MINUTES_PER_TURN : minutes
    }

    function handlePointerMove(event: PointerEventType<SVGSVGElement>) {
        setPreviewMinutes(durationAt(pointAt(event.clientX, event.clientY)))
    }

    function handlePointerLeave() {
        setPreviewMinutes(null)
    }

    function handleClick(event: ReactMouseEvent<SVGSVGElement>) {
        const numeral = numeralDurationAt(event.target)
        if (numeral !== null) {
            // A numeral is a one-click shortcut to its own duration.
            pick(numeral)
            return
        }
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

    /**
     * True while a duration is previewed — for the pointer that is exactly the
     * region a click would pick (AGENTS.md "Set a custom timer"), so it also drives
     * the cursor (see `TimerFace.module.css`). A keyboard preview sets it with
     * the pointer elsewhere, which only affects the cursor until the pointer
     * next moves.
     */
    const previewing = previewMinutes !== null

    /**
     * The minute the preview numeral shows, or null when no arc is drawn:
     * 0 minutes draws no arc, so the face stays in its normal state there.
     * While previewing, the numeral ring gives way to this single numeral
     * (AGENTS.md "Preview numeral").
     */
    const previewNumeral = previewing && previewMinutes > 0 ? previewMinutes : null

    return (
        <div className={styles.stage}>
            <svg
                ref={svgRef}
                className={styles.face}
                viewBox={DIAL_VIEWBOX}
                data-pickable={previewing}
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
                {DIAL_TICKS}
                {/*
                 * The remaining sector sits over the ticks and under everything
                 * else. It is slightly translucent, so it tints the ticks it
                 * swallows — the way the plastic overlay on a physical timer
                 * does. The numerals are outside the disc and so are never
                 * touched by it; the order keeps it that way if the disc grows.
                 */}
                <RemainingTime seconds={remainingSeconds} active={status === 'running'} />
                {/*
                 * The numeral ring and the preview's own chrome are mutually
                 * exclusive: while previewing, the ring is swapped for the single
                 * numeral the arc points at, and the ticks the arc covers are
                 * redrawn in the remaining colour — so the arc, its numeral and
                 * those ticks read as one mark.
                 */}
                {previewNumeral === null ? (
                    DIAL_NUMERALS
                ) : (
                    <>
                        <PreviewTicks minutes={previewNumeral} />
                        <PreviewNumeral minutes={previewNumeral} />
                    </>
                )}
                <PreviewArc previewMinutes={previewMinutes} />
                <CenterReadout status={status} remainingSeconds={remainingSeconds} />
                <CreatorMark />
                <Caption />
            </svg>
            <ReadoutControl status={status} onTogglePause={onTogglePause} onRestart={onRestart} />
        </div>
    )
}
