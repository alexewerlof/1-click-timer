/**
 * Geometry for the circular 60-minute dial.
 *
 * The dial counts down counter-clockwise, so more remaining time always reads
 * "further left". Angles are measured counter-clockwise from 12 o'clock:
 *
 *   0 min  -> 12 o'clock (top)      5 min  -> 11 o'clock
 *   30 min -> 6 o'clock (bottom)    55 min ->  1 o'clock
 *
 * Coordinates live in a square viewBox. The disc is only part of it: the ticks
 * radiate outward from the rim and the numerals sit outside those, which is what
 * gives the face its precision (MANUAL "Timer face"). The extra height below the
 * numerals carries the "Made in Sweden" caption arc.
 */

import { MAX_MINUTES, MAX_SECONDS } from './time'

export interface Point {
    x: number
    y: number
}

export const DIAL_CENTER_X = 70
/** Slightly above the middle, because the caption hangs below the numerals. */
export const DIAL_CENTER_Y = 62

/** The filled disc. Ticks cross this edge, so everything else reads as outside it. */
export const DISC_RADIUS = 42

/**
 * Ticks straddle the rim: their inner end sits just inside the disc and they
 * grow outwards, multiples of five reaching further. They are kept short and
 * hairline so the numerals stay the loudest thing on the face.
 *
 * The outer radius is capped by `MIN_TICK_NUMERAL_CLEARANCE` — see below.
 */
export const TICK_INNER_RADIUS = 41.2
export const TICK_MINOR_OUTER_RADIUS = 42.5
export const TICK_MAJOR_OUTER_RADIUS = 43.5

/**
 * Numerals hug the ticks, so the face reads as one compact instrument.
 * Every `NUMERAL_STEP` minutes gets a numeral: 0, 5, 10, ... 55.
 */
export const NUMERAL_RADIUS = 50
export const NUMERAL_STEP = 5

export const NUMERAL_MINUTES: readonly number[] = Array.from(
    { length: MAX_MINUTES / NUMERAL_STEP },
    (_, index) => index * NUMERAL_STEP,
)

/**
 * The readout disc: the white circle behind the readout. It contains the text,
 * so the text size is derived from it (see `READOUT_FONT_SIZE`) rather than
 * chosen by eye — that is what stops the readout spilling over the edge.
 */
export const READOUT_DISC_RADIUS = 7

/** The readout is always `M:SS` or `MM:SS`: at most four digits and a colon. */
const READOUT_MAX_DIGITS = 4

/** Approximate advance widths in em, for a bold tabular-numeral font. */
const DIGIT_ADVANCE_EM = 0.6
const COLON_ADVANCE_EM = 0.32

/** Cap height in em: how tall the digits actually are. */
const DIGIT_CAP_HEIGHT_EM = 0.72

/** Keep the text inside this fraction of the radius, for breathing room. */
const READOUT_FIT_RATIO = 0.86

/**
 * The largest font size whose text box still fits inside a circle of
 * `discRadius`. Treats the text as a rectangle and requires its corner to lie
 * inside the circle, which is the binding constraint for a wide, short string.
 */
export function readoutFontSizeFor(discRadius: number, digits: number): number {
    const widthEm = digits * DIGIT_ADVANCE_EM + COLON_ADVANCE_EM
    const halfWidthEm = widthEm / 2
    const halfHeightEm = DIGIT_CAP_HEIGHT_EM / 2

    const fitRadius = discRadius * READOUT_FIT_RATIO
    const diagonalEm = Math.hypot(halfWidthEm, halfHeightEm)

    // Rounds down, so the result can never be a hair too large.
    return Math.floor((fitRadius / diagonalEm) * 100) / 100
}

/** The `M:SS` countdown, e.g. "60:00" — the widest thing the readout shows. */
export const READOUT_FONT_SIZE = readoutFontSizeFor(READOUT_DISC_RADIUS, READOUT_MAX_DIGITS)

/** The bare minute count shown while previewing, e.g. "35". */
export const READOUT_PREVIEW_DIGITS = 2
export const READOUT_PREVIEW_FONT_SIZE = readoutFontSizeFor(READOUT_DISC_RADIUS, READOUT_PREVIEW_DIGITS)

/** Referenced by the readout disc's `filter` attribute. */
export const READOUT_SHADOW_ID = 'readout-disc-shadow'

/**
 * Soft drop shadow under the readout disc, so it reads as a layer above the dial
 * rather than a hole in it. Scaled off the disc radius like everything else, so
 * it stays in proportion if the disc is resized. The colour is a translucent
 * dark blue, set by `--readout-shadow` in `design/tokens.css`.
 *
 * Offset and blur are scaled together: a blur tighter than the offset turns the
 * soft halo into a detached crescent.
 */
export const READOUT_SHADOW = {
    offsetY: round(READOUT_DISC_RADIUS * 0.05),
    blur: round(READOUT_DISC_RADIUS * 0.08),
}

/**
 * Half the footprint of the widest numeral (a bold two-digit number such as
 * "15"). A numeral is about twice as wide as it is tall, so this is what caps
 * how far the ticks may reach before they would run into a glyph.
 */
export const NUMERAL_GLYPH_HALF_WIDTH = 5

/**
 * Smallest gap allowed between the end of a major tick and the edge of the
 * nearest numeral. The dominant ticks are horizontal, so this is a horizontal
 * gap. `dial.test.ts` asserts it, because the margin is only a unit or two and
 * is easy to eat into when the geometry is tuned by eye.
 */
export const MIN_TICK_NUMERAL_CLEARANCE = 1.5

/** Bottom of the "Made in Sweden" caption, which hangs below the numerals. */
const CAPTION_BOTTOM = 123

/**
 * The viewBox is cropped tight around the face rather than fixed. Every unit of
 * empty margin left in here is dial the user does not get, which is why these
 * are derived from the geometry above instead of written as literals. The
 * numerals are the outermost element, so they set the crop.
 */
export const DIAL_VIEWBOX_LEFT = DIAL_CENTER_X - NUMERAL_RADIUS - NUMERAL_GLYPH_HALF_WIDTH
export const DIAL_VIEWBOX_TOP = DIAL_CENTER_Y - NUMERAL_RADIUS - NUMERAL_GLYPH_HALF_WIDTH
export const DIAL_VIEWBOX_WIDTH = 2 * (NUMERAL_RADIUS + NUMERAL_GLYPH_HALF_WIDTH)
export const DIAL_VIEWBOX_HEIGHT = CAPTION_BOTTOM - DIAL_VIEWBOX_TOP

export const DIAL_VIEWBOX = `${DIAL_VIEWBOX_LEFT} ${DIAL_VIEWBOX_TOP} ${DIAL_VIEWBOX_WIDTH} ${DIAL_VIEWBOX_HEIGHT}`

/** Shallow arc below the numerals that the "Made in Sweden" text follows. */
export const CAPTION_PATH = 'M 34 115 Q 70 125 106 115'

export const CAPTION_PATH_ID = 'made-in-sweden-path'

/** The creator mark returns once the dial is settled (MANUAL "UI elements"). */
export const SHOW_CREATOR_MARK = false

export const MINUTES_PER_TURN = MAX_MINUTES

const DEGREES_PER_MINUTE = 360 / MINUTES_PER_TURN

/** Keeps SVG output compact (see `rendering-svg-precision`). */
function round(value: number): number {
    return Math.round(value * 1000) / 1000
}

/** Counter-clockwise angle from 12 o'clock, in degrees. */
export function minutesToAngle(minutes: number): number {
    const wrapped = ((minutes % MINUTES_PER_TURN) + MINUTES_PER_TURN) % MINUTES_PER_TURN
    return wrapped * DEGREES_PER_MINUTE
}

export function pointOnDial(minutes: number, radius: number): Point {
    const radians = (minutesToAngle(minutes) * Math.PI) / 180
    return {
        x: round(DIAL_CENTER_X - Math.sin(radians) * radius),
        y: round(DIAL_CENTER_Y - Math.cos(radians) * radius),
    }
}

/** Inverse of `pointOnDial`: which minute sits under this point (0..60). */
export function pointToMinutes(point: Point): number {
    const dx = point.x - DIAL_CENTER_X
    const dy = DIAL_CENTER_Y - point.y
    const clockwise = (Math.atan2(dx, dy) * 180) / Math.PI
    const counterClockwise = ((-clockwise % 360) + 360) % 360
    return counterClockwise / DEGREES_PER_MINUTE
}

/**
 * The minute under a pointer. Uses the SVG's own screen matrix, so scaling or
 * letterboxing of the element cannot skew the result.
 */
export function clientPointToMinutes(svg: SVGSVGElement, clientX: number, clientY: number): number {
    const matrix = svg.getScreenCTM()
    if (!matrix) return 0
    const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse())
    return pointToMinutes({ x: point.x, y: point.y })
}

function minutesOfSeconds(seconds: number): number {
    const clamped = Math.min(MAX_SECONDS, Math.max(0, seconds))
    return (clamped / MAX_SECONDS) * MINUTES_PER_TURN
}

/**
 * Pie slice from 12 o'clock counter-clockwise to the remaining time — the red
 * area that shrinks towards the top as the timer runs. Empty when time is up,
 * and for a whole turn (an arc cannot close on itself).
 */
export function remainingSectorPath(seconds: number): string {
    const minutes = minutesOfSeconds(seconds)
    if (minutes <= 0 || minutes >= MINUTES_PER_TURN) return ''

    const from = pointOnDial(0, DISC_RADIUS)
    const to = pointOnDial(minutes, DISC_RADIUS)
    const largeArc = minutes > MINUTES_PER_TURN / 2 ? 1 : 0

    return [
        `M ${DIAL_CENTER_X} ${DIAL_CENTER_Y}`,
        `L ${from.x} ${from.y}`,
        `A ${DISC_RADIUS} ${DISC_RADIUS} 0 ${largeArc} 0 ${to.x} ${to.y}`,
        'Z',
    ].join(' ')
}

/** Unfilled arc used for the preliminary (hover) indicator. */
export function remainingArcPath(seconds: number): string {
    const minutes = minutesOfSeconds(seconds)
    if (minutes <= 0 || minutes >= MINUTES_PER_TURN) return ''

    const from = pointOnDial(0, DISC_RADIUS)
    const to = pointOnDial(minutes, DISC_RADIUS)
    const largeArc = minutes > MINUTES_PER_TURN / 2 ? 1 : 0

    return `M ${from.x} ${from.y} A ${DISC_RADIUS} ${DISC_RADIUS} 0 ${largeArc} 0 ${to.x} ${to.y}`
}

export interface DialTick {
    /** Which minute of the dial this tick marks. */
    minute: number
    /** Multiples of five get a thicker stroke and a numeral. */
    major: boolean
    /** Just inside the rim, so the tick reads as a mark on the dial edge. */
    inner: Point
    /** Outwards, well clear of the rim for the majors. */
    outer: Point
}

function buildTicks(): readonly DialTick[] {
    const ticks: DialTick[] = []
    for (let minute = 0; minute < MINUTES_PER_TURN; minute += 1) {
        const major = minute % 5 === 0
        ticks.push({
            minute,
            major,
            inner: pointOnDial(minute, TICK_INNER_RADIUS),
            outer: pointOnDial(minute, major ? TICK_MAJOR_OUTER_RADIUS : TICK_MINOR_OUTER_RADIUS),
        })
    }
    return ticks
}

/** Static geometry, computed once at module load rather than on every render. */
export const DIAL_TICKS: readonly DialTick[] = buildTicks()

export const DIAL_MAJOR_TICKS: readonly DialTick[] = DIAL_TICKS.filter((tick) => tick.major)
