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
 * gives the face its precision (AGENTS.md "Face"). The numerals are the
 * outermost element, so they bound the crop on every side.
 */

import { MAX_MINUTES, MAX_SECONDS } from './time'

export interface Point {
    x: number
    y: number
}

export const DIAL_CENTER_X = 70
/** The middle of the square crop: the numerals bound it on every side. */
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

/** Referenced by the readout disc's `filter` attribute. */
export const READOUT_SHADOW_ID = 'readout-disc-shadow'

/** Referenced by the disc's inner-shadow `filter` attribute. */
export const DISC_INNER_SHADOW_ID = 'disc-inner-shadow'

export interface DialShadow {
    /** Downwards, because the light is above the dial. */
    offsetY: number
    blur: number
}

/** Offset and blur as fractions of the shadowed radius. */
interface ShadowRatios {
    offset: number
    blur: number
}

/** Scaled off the radius, so a shadow stays in proportion if the dial is resized. */
function shadowFor(radius: number, ratios: ShadowRatios): DialShadow {
    return {
        offsetY: round(radius * ratios.offset),
        blur: round(radius * ratios.blur),
    }
}

/**
 * Kept together because a blur tighter than the offset turns a soft halo into a
 * detached crescent.
 */
const READOUT_SHADOW_RATIOS: ShadowRatios = { offset: 0.05, blur: 0.08 }

/**
 * The disc is six times the readout disc's radius, so the readout's proportions
 * would spread a grey wash across the whole face. The rim keeps the same light —
 * offset downwards, in the colour of `--disc-inner-shadow` — in a much tighter
 * and shallower band: just enough to suggest where the disc ends, so the face
 * stays white.
 */
const DISC_INNER_SHADOW_RATIOS: ShadowRatios = { offset: 0.01, blur: 0.02 }

/**
 * Soft drop shadow under the readout disc, so it reads as a layer above the dial
 * rather than a hole in it. The colour is a translucent dark blue, set by
 * `--readout-shadow` in `design/tokens.css`.
 */
export const READOUT_SHADOW = shadowFor(READOUT_DISC_RADIUS, READOUT_SHADOW_RATIOS)

/**
 * Shadow cast *inwards* from the disc's rim, so the disc reads as a shallow
 * recess in the face rather than a circle drawn on it: what the readout disc's
 * shadow is to the dial, an inner shadow is to the rim.
 */
export const DISC_INNER_SHADOW = shadowFor(DISC_RADIUS, DISC_INNER_SHADOW_RATIOS)

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

/**
 * The viewBox is cropped tight around the face rather than fixed. Every unit of
 * empty margin left in here is dial the user does not get, which is why these
 * are derived from the geometry above instead of written as literals. The
 * numerals are the outermost element, so they set the crop on every side — which
 * is why it is square.
 */
const DIAL_VIEWBOX_LEFT = DIAL_CENTER_X - NUMERAL_RADIUS - NUMERAL_GLYPH_HALF_WIDTH
const DIAL_VIEWBOX_TOP = DIAL_CENTER_Y - NUMERAL_RADIUS - NUMERAL_GLYPH_HALF_WIDTH
export const DIAL_VIEWBOX_WIDTH = 2 * (NUMERAL_RADIUS + NUMERAL_GLYPH_HALF_WIDTH)
const DIAL_VIEWBOX_HEIGHT = DIAL_VIEWBOX_WIDTH

export const DIAL_VIEWBOX = `${DIAL_VIEWBOX_LEFT} ${DIAL_VIEWBOX_TOP} ${DIAL_VIEWBOX_WIDTH} ${DIAL_VIEWBOX_HEIGHT}`

/**
 * The readout disc's diameter as a fraction of the face's rendered side. The
 * readout control (`ReadoutControl`) is sized from this rather than by eye, so
 * its click surface stays exactly the disc.
 *
 * The viewBox is square and the readout disc is concentric with it, so the
 * rendered face is the smaller of the element's two sides — which is what the
 * control's `cqmin` unit resolves to (see `.stage` in `TimerFace.module.css`).
 */
export const READOUT_DISC_DIAMETER_RATIO = (2 * READOUT_DISC_RADIUS) / DIAL_VIEWBOX_WIDTH

/**
 * The creator mark: the Alex Ewerlöf wordmark, inlined in `CreatorMark` and
 * filled with the dial's ink — the numerals' and ticks' colour (AGENTS.md "Creator
 * mark"). It sits in the band between the readout disc and the 0 numeral, where
 * a watch carries its maker's name.
 *
 * Its box is the source art's own canvas, and the art is centred in that canvas,
 * so the box's centre is the mark's centre.
 */
export const CREATOR_MARK_VIEWBOX = '0 0 500 250'

/** The canvas is 2:1, so the box is as well. */
const CREATOR_MARK_ASPECT = 250 / 500

/**
 * Kept deliberately small: the mark introduces the maker without competing with
 * the readout. The ratio is its width as a multiple of the readout disc's
 * diameter, so it keeps its proportion if the disc is resized.
 */
export const CREATOR_MARK_WIDTH_RATIO = 1.15
export const CREATOR_MARK_WIDTH = CREATOR_MARK_WIDTH_RATIO * 2 * READOUT_DISC_RADIUS
export const CREATOR_MARK_HEIGHT = CREATOR_MARK_WIDTH * CREATOR_MARK_ASPECT

/**
 * Where the mark sits across the band, 0 at the readout disc's rim and 1 at the
 * numeral ring. Held below halfway so the mark hugs the disc — a watch sets its
 * maker's name just above the centre rather than floating mid-band.
 */
const CREATOR_MARK_BAND_POSITION = 0.35

export const CREATOR_MARK_CENTER_Y =
    DIAL_CENTER_Y - (READOUT_DISC_RADIUS + CREATOR_MARK_BAND_POSITION * (NUMERAL_RADIUS - READOUT_DISC_RADIUS))
export const CREATOR_MARK_X = DIAL_CENTER_X - CREATOR_MARK_WIDTH / 2
export const CREATOR_MARK_Y = CREATOR_MARK_CENTER_Y - CREATOR_MARK_HEIGHT / 2

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

/**
 * How far the caption's baseline sits inside the ticks' inner ends. The letters
 * rise from the baseline towards the centre, so it is the baseline — not the top
 * of the text — that runs closest to the ticks. Holding it just inside
 * `TICK_INNER_RADIUS` puts the caption at the very edge of the disc, almost
 * touching the ticks, and keeps that gap honest if the ticks are tuned.
 */
const CAPTION_BASELINE_CLEARANCE = 0.5
const CAPTION_RADIUS = round(TICK_INNER_RADIUS - CAPTION_BASELINE_CLEARANCE)

/** Half the caption arc's angular span, in dial minutes either side of 6 o'clock. */
const CAPTION_HALF_SPAN_MINUTES = 3

/**
 * Circular arc, concentric with the disc, that the "Made in Sweden" text
 * follows (AGENTS.md "Caption"). It hugs the bottom rim, centred on 6 o'clock, so
 * the text reads left to right just inside the ticks.
 */
export const CAPTION_PATH = captionArcPath()

function captionArcPath(): string {
    const bottom = MINUTES_PER_TURN / 2
    const start = pointOnDial(bottom - CAPTION_HALF_SPAN_MINUTES, CAPTION_RADIUS)
    const end = pointOnDial(bottom + CAPTION_HALF_SPAN_MINUTES, CAPTION_RADIUS)
    return `M ${start.x} ${start.y} A ${CAPTION_RADIUS} ${CAPTION_RADIUS} 0 0 0 ${end.x} ${end.y}`
}

/** Referenced by `Caption`'s `textPath`. */
export const CAPTION_PATH_ID = 'made-in-sweden-path'

/** Inverse of `pointOnDial`: which minute sits under this point (0..60). */
export function pointToMinutes(point: Point): number {
    const dx = point.x - DIAL_CENTER_X
    const dy = DIAL_CENTER_Y - point.y
    const clockwise = (Math.atan2(dx, dy) * 180) / Math.PI
    const counterClockwise = ((-clockwise % 360) + 360) % 360
    return counterClockwise / DEGREES_PER_MINUTE
}

/**
 * The whole minute nearest a continuous dial reading, in 1..60. Rounding makes
 * every minute a full wedge: a pointer anywhere from half a minute before its
 * tick to half a minute after it picks that minute, so the disc is fully
 * covered and there are no dead slivers between the marks.
 *
 * 0 and 60 are the same mark, 12 o'clock, and it stands for a whole turn rather
 * than no timer, so a reading that rounds to 0 — the half-minute either side of
 * the top — reports 60. That keeps the whole disc live: the pointer can never
 * ask for an empty timer, and the idle state is reached by taking the pointer
 * off the disc, not by a minute. Only the keyboard still sets 0 (see
 * `TimerFace`), by way of the reset-and-idle state.
 */
export function nearestMinute(minutes: number): number {
    const rounded = Math.round(minutes) % MINUTES_PER_TURN
    return rounded === 0 ? MINUTES_PER_TURN : rounded
}

/**
 * The dial-space point under a client coordinate. Uses the SVG's own screen
 * matrix, so scaling or letterboxing of the element cannot skew the result.
 * Null before the element has a layout, when the matrix is unavailable.
 */
export function clientPointToDialPoint(svg: SVGSVGElement, clientX: number, clientY: number): Point | null {
    const matrix = svg.getScreenCTM()
    if (!matrix) return null
    const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse())
    return { x: point.x, y: point.y }
}

/** Distance of a dial point from the centre. */
export function dialRadiusOf(point: Point): number {
    return Math.hypot(point.x - DIAL_CENTER_X, point.y - DIAL_CENTER_Y)
}

/** Whether a dial point lies on the disc (AGENTS.md "UI vocabulary"). */
export function isPointOnDisc(point: Point): boolean {
    return dialRadiusOf(point) <= DISC_RADIUS
}

/**
 * Whether a dial point lies inside the readout disc at the centre of the disc.
 * The readout disc reads as a layer above the dial, so the pointer does not
 * preview a duration over it.
 */
export function isPointInsideReadoutDisc(point: Point): boolean {
    return dialRadiusOf(point) < READOUT_DISC_RADIUS
}

function minutesOfSeconds(seconds: number): number {
    const clamped = Math.min(MAX_SECONDS, Math.max(0, seconds))
    return (clamped / MAX_SECONDS) * MINUTES_PER_TURN
}

/**
 * The remaining sector is an *annular* wedge: a pie slice with the readout disc
 * cut out of its middle, so its inner edge is a circle rather than the sharp
 * corner that used to point at the centre. That way the shape that is drawn is
 * the shape that is seen — nothing has to be painted over the corner to hide it
 * (AGENTS.md "Remaining sector").
 *
 * The radii are named so a gap can be dialled in later: drop `SECTOR_INNER_RADIUS`
 * inwards (or `SECTOR_OUTER_RADIUS` inwards from the rim) and the filled wedge
 * steps back from the readout disc without touching the path maths.
 */
export const SECTOR_INNER_RADIUS = READOUT_DISC_RADIUS
export const SECTOR_OUTER_RADIUS = DISC_RADIUS

/**
 * Annular wedge from 12 o'clock counter-clockwise to `minutes`: the outer arc, a
 * radial step inwards, the inner arc back, and the radial edge closing it at 12
 * o'clock. Both arcs sweep the same span, so they share the large-arc flag; the
 * inner one runs the other way (clockwise) to retrace.
 */
function annularSectorPath(minutes: number): string {
    const largeArc = minutes > MINUTES_PER_TURN / 2 ? 1 : 0
    const outerFrom = pointOnDial(0, SECTOR_OUTER_RADIUS)
    const outerTo = pointOnDial(minutes, SECTOR_OUTER_RADIUS)
    const innerTo = pointOnDial(minutes, SECTOR_INNER_RADIUS)
    const innerFrom = pointOnDial(0, SECTOR_INNER_RADIUS)

    return [
        `M ${outerFrom.x} ${outerFrom.y}`,
        `A ${SECTOR_OUTER_RADIUS} ${SECTOR_OUTER_RADIUS} 0 ${largeArc} 0 ${outerTo.x} ${outerTo.y}`,
        `L ${innerTo.x} ${innerTo.y}`,
        `A ${SECTOR_INNER_RADIUS} ${SECTOR_INNER_RADIUS} 0 ${largeArc} 1 ${innerFrom.x} ${innerFrom.y}`,
        'Z',
    ].join(' ')
}

/**
 * A whole turn: an annular wedge of 360°, which is a ring — the disc with the
 * readout disc's hole in it. Two half-turn arcs make each circle, because a
 * single arc cannot close on itself (its ends would coincide and SVG draws
 * nothing).
 */
function fullRingPath(): string {
    const outerTop = pointOnDial(0, SECTOR_OUTER_RADIUS)
    const outerBottom = pointOnDial(MINUTES_PER_TURN / 2, SECTOR_OUTER_RADIUS)
    const innerTop = pointOnDial(0, SECTOR_INNER_RADIUS)
    const innerBottom = pointOnDial(MINUTES_PER_TURN / 2, SECTOR_INNER_RADIUS)

    return [
        `M ${outerTop.x} ${outerTop.y}`,
        `A ${SECTOR_OUTER_RADIUS} ${SECTOR_OUTER_RADIUS} 0 1 0 ${outerBottom.x} ${outerBottom.y}`,
        `A ${SECTOR_OUTER_RADIUS} ${SECTOR_OUTER_RADIUS} 0 1 0 ${outerTop.x} ${outerTop.y}`,
        `L ${innerTop.x} ${innerTop.y}`,
        `A ${SECTOR_INNER_RADIUS} ${SECTOR_INNER_RADIUS} 0 1 1 ${innerBottom.x} ${innerBottom.y}`,
        `A ${SECTOR_INNER_RADIUS} ${SECTOR_INNER_RADIUS} 0 1 1 ${innerTop.x} ${innerTop.y}`,
        'Z',
    ].join(' ')
}

/**
 * The red area that shrinks towards the top as the timer runs: an annular wedge
 * from 12 o'clock counter-clockwise to the remaining time, from the readout
 * disc's rim out to the disc's rim. Empty when the time is up; a whole turn is
 * a ring.
 */
export function remainingSectorPath(seconds: number): string {
    const minutes = minutesOfSeconds(seconds)
    if (minutes <= 0) return ''
    if (minutes >= MINUTES_PER_TURN) return fullRingPath()
    return annularSectorPath(minutes)
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

/**
 * The ticks a preview of `minutes` covers: every tick whose angle falls inside
 * the arc's span, which runs counter-clockwise from 12 o'clock (minute 0) to
 * `minutes`. The span is closed at both ends, so the two ticks bounding the arc
 * light up with it — and a whole turn covers every tick.
 */
export function ticksWithinPreview(minutes: number): readonly DialTick[] {
    return DIAL_TICKS.filter((tick) => tick.minute <= minutes)
}
