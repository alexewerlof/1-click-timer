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
    nearestMinute,
    pointToMinutes,
} from '../../lib/dial'
import type { Point } from '../../lib/dial'
import { SECONDS_PER_MINUTE } from '../../lib/time'
import type { RemainingColor } from '../../runtime/settings'
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

/**
 * The 0 numeral marks where a whole turn ends, so it is the reset control
 * rather than a 0-minute timer (AGENTS.md "Set a custom timer").
 */
const RESET_NUMERAL_MINUTES = 0

export interface TimerFaceProps {
    status: TimerStatus
    remainingSeconds: number
    /** The duration this countdown was started with — where the Conic sweep's green sits. */
    durationSeconds: number
    /** How the remaining sector is painted (AGENTS.md "Remaining sector"). */
    remainingAppearance: RemainingColor
    /** Receives the chosen duration in seconds. */
    onPick: (seconds: number) => void
    /** Re-run the last duration, from the control the disc offers while paused or ringing. */
    onRestart: () => void
    /** Reset to idle and silence any ringing alarm, from the 0 numeral. */
    onReset: () => void
}

function clampMinutes(minutes: number): number {
    return Math.min(MINUTES_PER_TURN, Math.max(0, minutes))
}

/**
 * The face: hover or click the dial to set a timer, or click a numeral to start
 * that many minutes outright. The 0 numeral marks where a whole turn ends, so it
 * resets the timer instead (AGENTS.md "Set a custom timer").
 *
 * Exposed as a slider so the disc action is reachable from the keyboard —
 * arrows move counter-clockwise (more time) and clockwise (less time), shift
 * jumps by five, Enter sets the timer.
 *
 * The readout disc carries its own control (`ReadoutControl`), a real HTML button
 * overlaid on the face rather than drawn in it.
 */
export function TimerFace({
    status,
    remainingSeconds,
    durationSeconds,
    remainingAppearance,
    onPick,
    onRestart,
    onReset,
}: TimerFaceProps) {
    const svgRef = useRef<SVGSVGElement>(null)
    const [previewMinutes, setPreviewMinutes] = useState<number | null>(null)

    /** The dial-space point under a client coordinate, or null before layout. */
    function pointAt(clientX: number, clientY: number): Point | null {
        const svg = svgRef.current
        if (!svg) return null
        return clientPointToDialPoint(svg, clientX, clientY)
    }

    /**
     * The minute a dial-space point marks — the nearest whole minute, so every
     * minute is a full wedge of half a minute either side of its tick — or null
     * when the point is not on the disc, or sits over the readout disc at its
     * centre. The readout disc reads as a layer above the dial, so both hover
     * and click ignore it; off the disc there is nothing to show either.
     *
     * The half-minute either side of 12 o'clock belongs to the minute that
     * rounds to 0, which `nearestMinute` reports as a whole turn (60) rather
     * than an empty timer — so the pointer can never pick "nothing".
     */
    function durationAt(point: Point | null): number | null {
        if (!point || !isPointOnDisc(point) || isPointInsideReadoutDisc(point)) return null
        return nearestMinute(pointToMinutes(point))
    }

    /**
     * The minute of the numeral a click landed on, or null when it did not land
     * on one. Read from `data-numeral-minutes` rather than the pointer's
     * position, because a numeral sits outside the disc (see `dialChrome`).
     */
    function numeralMinutesAt(target: EventTarget | null): number | null {
        if (!(target instanceof Element)) return null
        const label = target.closest('[data-numeral-minutes]')?.getAttribute('data-numeral-minutes')
        if (label === null || label === undefined) return null
        return Number(label)
    }

    /**
     * The minute a pointer position previews: the numeral under the pointer when
     * it is over one, or the dial point otherwise. A numeral sits outside the
     * disc, so the pointer's position alone cannot identify it — but it is the
     * same choice a click would make there, so hovering a numeral shows exactly
     * what hovering the disc at that minute shows (AGENTS.md "Preview numeral").
     *
     * The 0 numeral is the reset control, not a duration, so hovering it previews
     * nothing — matching the click (see `handleClick`).
     */
    function previewMinutesAt(event: PointerEventType<SVGSVGElement>): number | null {
        const numeral = numeralMinutesAt(event.target)
        if (numeral !== null) return numeral === RESET_NUMERAL_MINUTES ? null : numeral
        return durationAt(pointAt(event.clientX, event.clientY))
    }

    function handlePointerMove(event: PointerEventType<SVGSVGElement>) {
        setPreviewMinutes(previewMinutesAt(event))
    }

    function handlePointerLeave() {
        setPreviewMinutes(null)
    }

    function handleClick(event: ReactMouseEvent<SVGSVGElement>) {
        const numeral = numeralMinutesAt(event.target)
        if (numeral !== null) {
            // The 0 numeral marks a whole turn, where a timer would end, so it
            // resets. Every other numeral is a one-click shortcut to its own
            // duration.
            if (numeral === RESET_NUMERAL_MINUTES) {
                onReset()
                return
            }
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
                data-previewing={previewNumeral !== null}
                /*
                 * While the timer counts down the face is someone else's
                 * instrument — a projector, most often — so the branding steps
                 * aside and the remaining sector is the only thing to read
                 * (AGENTS.md "Creator mark").
                 */
                data-running={status === 'running'}
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
                {/*
                 * The remaining sector sits over the disc and under the ticks.
                 * It is slightly translucent, so the disc's edge shadow reads
                 * through it, but the ticks are painted after it and so keep
                 * their full ink rather than being tinted by it. The numerals
                 * are outside the disc and so are never touched by it; the order
                 * keeps it that way if the disc grows.
                 */}
                <RemainingTime
                    seconds={remainingSeconds}
                    active={status === 'running'}
                    durationSeconds={durationSeconds}
                    appearance={remainingAppearance}
                />
                {DIAL_TICKS}
                {/*
                 * The numeral ring stays mounted while previewing, faded out by
                 * `data-previewing` on the face (see the CSS). It is not swapped
                 * for the preview numeral: keeping it in the tree is what lets the
                 * numeral under the pointer keep its hit target, so the hover does
                 * not flicker and the click that starts the timer still lands on
                 * it. The preview's own chrome is drawn over the faded ring — the
                 * ticks the arc covers in the remaining colour, and the single
                 * numeral the arc points at — so the arc, its numeral and those
                 * ticks read as one mark.
                 */}
                {DIAL_NUMERALS}
                {previewNumeral !== null && (
                    <>
                        <PreviewTicks minutes={previewNumeral} />
                        <PreviewNumeral minutes={previewNumeral} />
                    </>
                )}
                <PreviewArc previewMinutes={previewMinutes} />
                <CenterReadout status={status} remainingSeconds={remainingSeconds} />
                {/* Faded out while running, not unmounted — see `.creatorMark`. */}
                <CreatorMark />
                <Caption />
            </svg>
            <ReadoutControl status={status} onRestart={onRestart} />
        </div>
    )
}
