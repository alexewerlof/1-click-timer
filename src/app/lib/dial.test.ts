import { describe, expect, it } from 'vitest'
import {
    DIAL_CENTER_X,
    DIAL_CENTER_Y,
    DISC_RADIUS,
    READOUT_DISC_RADIUS,
    READOUT_DISC_DIAMETER_RATIO,
    DIAL_VIEWBOX_WIDTH,
    DIAL_TICKS,
    CREATOR_MARK_HEIGHT,
    CREATOR_MARK_WIDTH,
    CREATOR_MARK_WIDTH_RATIO,
    CREATOR_MARK_X,
    CREATOR_MARK_Y,
    NUMERAL_GLYPH_HALF_WIDTH,
    NUMERAL_RADIUS,
    MINUTES_PER_TURN,
    MIN_TICK_NUMERAL_CLEARANCE,
    TICK_INNER_RADIUS,
    dialRadiusOf,
    isPointInsideReadoutDisc,
    isPointOnDisc,
    nearestMinute,
    pointOnDial,
    pointToMinutes,
    remainingArcPath,
    remainingSectorPath,
    ticksWithinPreview,
} from './dial'
import { MAX_SECONDS, SECONDS_PER_MINUTE } from './time'

/** Distance of a dial point from the centre. */
function radiusOf(point: { x: number; y: number }): number {
    return Math.hypot(point.x - DIAL_CENTER_X, point.y - DIAL_CENTER_Y)
}

describe('pointOnDial', () => {
    it('puts 0 at 12 o’clock', () => {
        const point = pointOnDial(0, DISC_RADIUS)
        expect(point.x).toBeCloseTo(DIAL_CENTER_X, 3)
        expect(point.y).toBeCloseTo(DIAL_CENTER_Y - DISC_RADIUS, 3)
    })

    it('counts counter-clockwise: 5 is at 11 o’clock, 55 at 1 o’clock', () => {
        const five = pointOnDial(5, DISC_RADIUS)
        expect(five.x).toBeLessThan(DIAL_CENTER_X)
        expect(five.y).toBeLessThan(DIAL_CENTER_Y)

        const fiftyFive = pointOnDial(55, DISC_RADIUS)
        expect(fiftyFive.x).toBeGreaterThan(DIAL_CENTER_X)
        expect(fiftyFive.y).toBeLessThan(DIAL_CENTER_Y)
    })

    it('puts half the dial directly below the centre', () => {
        const halfway = pointOnDial(MINUTES_PER_TURN / 2, DISC_RADIUS)
        expect(halfway.x).toBeCloseTo(DIAL_CENTER_X, 3)
        expect(halfway.y).toBeCloseTo(DIAL_CENTER_Y + DISC_RADIUS, 3)
    })
})

describe('pointToMinutes', () => {
    it('inverts pointOnDial for every tick', () => {
        for (const tick of DIAL_TICKS) {
            expect(pointToMinutes(tick.outer)).toBeCloseTo(tick.minute, 2)
        }
    })

    it('reads the top of the dial as minute 0', () => {
        expect(pointToMinutes({ x: DIAL_CENTER_X, y: 0 })).toBeCloseTo(0, 3)
    })

    it('reads the left of the dial as a quarter turn in', () => {
        expect(pointToMinutes({ x: 0, y: DIAL_CENTER_Y })).toBeCloseTo(15, 3)
    })
})

describe('nearestMinute', () => {
    it('rounds a reading onto the nearest whole minute', () => {
        expect(nearestMinute(13.5)).toBe(14)
        expect(nearestMinute(14.49)).toBe(14)
        expect(nearestMinute(14.5)).toBe(15)
    })

    it('gives every minute a wedge of half a minute either side of its tick', () => {
        // The point a hair inside either edge rounds to that minute, so the
        // disc is fully covered and no sliver is left unpreviewed.
        expect(nearestMinute(14 - 0.49)).toBe(14)
        expect(nearestMinute(14 + 0.49)).toBe(14)
    })

    it('reports a whole turn for either side of 12 o’clock', () => {
        // 0 and 60 are the same mark, so both halves of its wedge ask for a
        // whole turn rather than an empty timer.
        expect(nearestMinute(0)).toBe(MINUTES_PER_TURN)
        expect(nearestMinute(0.49)).toBe(MINUTES_PER_TURN)
        expect(nearestMinute(59.5)).toBe(MINUTES_PER_TURN)
        expect(nearestMinute(60)).toBe(MINUTES_PER_TURN)
    })

    it('never returns 0, so the pointer can always ask for a timer', () => {
        for (let reading = 0; reading < MINUTES_PER_TURN; reading += 0.1) {
            expect(nearestMinute(reading)).toBeGreaterThan(0)
        }
    })
})

describe('remainingSectorPath', () => {
    it('draws nothing when the time is up', () => {
        expect(remainingSectorPath(0)).toBe('')
    })

    it('draws nothing for a whole turn, because an arc cannot close', () => {
        expect(remainingSectorPath(MAX_SECONDS)).toBe('')
    })

    it('starts at the centre and 12 o’clock', () => {
        const path = remainingSectorPath(10 * SECONDS_PER_MINUTE)
        expect(path.startsWith(`M ${DIAL_CENTER_X} ${DIAL_CENTER_Y} L `)).toBe(true)
    })

    it('sets the large-arc flag once more than half the dial is left', () => {
        const underHalf = remainingSectorPath(20 * SECONDS_PER_MINUTE)
        expect(underHalf).toContain('0 0 0 ')
        const overHalf = remainingSectorPath(40 * SECONDS_PER_MINUTE)
        expect(overHalf).toContain('0 1 0 ')
    })

    it('sweeps counter-clockwise, ending on the remaining-time point', () => {
        const quarter = pointOnDial(15, DISC_RADIUS)
        expect(quarter.x).toBeLessThan(DIAL_CENTER_X)
        expect(remainingSectorPath(15 * SECONDS_PER_MINUTE)).toContain(`${quarter.x} ${quarter.y}`)
    })
})

describe('remainingArcPath', () => {
    it('is empty at both ends of the dial', () => {
        expect(remainingArcPath(0)).toBe('')
        expect(remainingArcPath(MAX_SECONDS)).toBe('')
    })

    it('is an open arc from 12 o’clock', () => {
        const top = pointOnDial(0, DISC_RADIUS)
        const path = remainingArcPath(15 * SECONDS_PER_MINUTE)
        expect(path.startsWith(`M ${top.x} ${top.y} A `)).toBe(true)
        expect(path.endsWith('Z')).toBe(false)
    })
})

describe('ticksWithinPreview', () => {
    it('covers the span from 12 o’clock to the previewed minute, both ends included', () => {
        const expected = Array.from({ length: 16 }, (_, index) => index)
        expect(ticksWithinPreview(15).map((tick) => tick.minute)).toEqual(expected)
    })

    it('covers every tick for a whole turn', () => {
        expect(ticksWithinPreview(MINUTES_PER_TURN)).toHaveLength(DIAL_TICKS.length)
    })
})

describe('dial pointer regions', () => {
    it('measures the radius from the dial centre', () => {
        expect(dialRadiusOf({ x: DIAL_CENTER_X, y: DIAL_CENTER_Y })).toBe(0)
        expect(dialRadiusOf(pointOnDial(20, DISC_RADIUS))).toBeCloseTo(DISC_RADIUS, 2)
    })

    it('treats the disc rim as on the disc and the numerals as off it', () => {
        expect(isPointOnDisc(pointOnDial(0, DISC_RADIUS))).toBe(true)
        expect(isPointOnDisc(pointOnDial(0, NUMERAL_RADIUS))).toBe(false)
    })

    it('treats the readout disc’s centre as inside it', () => {
        expect(isPointInsideReadoutDisc({ x: DIAL_CENTER_X, y: DIAL_CENTER_Y })).toBe(true)
    })

    it('treats the readout disc’s rim as outside it, where the ring begins', () => {
        const onReadoutRim = pointOnDial(0, READOUT_DISC_RADIUS)
        expect(isPointInsideReadoutDisc(onReadoutRim)).toBe(false)
        expect(isPointOnDisc(onReadoutRim)).toBe(true)
    })

    it('treats the space beyond the disc as outside it', () => {
        expect(isPointInsideReadoutDisc(pointOnDial(0, NUMERAL_RADIUS))).toBe(false)
        expect(isPointOnDisc(pointOnDial(0, NUMERAL_RADIUS + 1))).toBe(false)
    })
})

describe('dial geometry constants', () => {
    it('has one tick per minute, with majors every five', () => {
        expect(DIAL_TICKS).toHaveLength(MINUTES_PER_TURN)
        expect(DIAL_TICKS.filter((tick) => tick.major)).toHaveLength(12)
    })

    it('keeps every tick clear of the numerals', () => {
        // A numeral is about twice as wide as it is tall, so the horizontal
        // numerals are the ones a tick can actually collide with.
        const innerEdgeOfNumeral = NUMERAL_RADIUS - NUMERAL_GLYPH_HALF_WIDTH
        const longestTick = Math.max(...DIAL_TICKS.map((tick) => radiusOf(tick.outer)))

        expect(innerEdgeOfNumeral - longestTick).toBeGreaterThanOrEqual(MIN_TICK_NUMERAL_CLEARANCE)
    })

    it('keeps the numerals outside the disc, where the sector cannot reach them', () => {
        // The remaining sector fills the disc and nothing more (see
        // `remainingSectorPath`), while the numerals sit beyond the ticks on
        // their own ring. That gap is what keeps the translucent fill off a
        // numeral's ink — the sector tints the ticks it swallows and stops there.
        expect(NUMERAL_RADIUS - NUMERAL_GLYPH_HALF_WIDTH).toBeGreaterThan(DISC_RADIUS)
    })

    it('straddles the disc rim, so the ticks read as part of the face', () => {
        expect(TICK_INNER_RADIUS).toBeLessThan(DISC_RADIUS)
        expect(DIAL_TICKS.some((tick) => radiusOf(tick.outer) > DISC_RADIUS)).toBe(true)
    })

    it('turns the face’s rendered side back into the readout disc’s diameter', () => {
        // The readout control is `READOUT_DISC_DIAMETER_RATIO × cqmin`, and
        // `cqmin` is the rendered square face (the viewBox is square). So the
        // ratio must map the viewBox width onto the disc's diameter — that is
        // what keeps the button's click surface exactly the disc at any size.
        expect(READOUT_DISC_DIAMETER_RATIO * DIAL_VIEWBOX_WIDTH).toBeCloseTo(2 * READOUT_DISC_RADIUS, 10)
        expect(READOUT_DISC_DIAMETER_RATIO).toBeGreaterThan(0)
        expect(READOUT_DISC_DIAMETER_RATIO).toBeLessThan(1)
    })
})

describe('creator mark', () => {
    it('sits in the band between the readout disc and the 0 numeral', () => {
        // Below the 0 numeral's anchor, and above the readout disc's rim.
        expect(CREATOR_MARK_Y).toBeGreaterThan(DIAL_CENTER_Y - NUMERAL_RADIUS)
        expect(CREATOR_MARK_Y + CREATOR_MARK_HEIGHT).toBeLessThan(DIAL_CENTER_Y - READOUT_DISC_RADIUS)
    })

    it('keeps every corner of the mark inside the disc', () => {
        const corners = [
            { x: CREATOR_MARK_X, y: CREATOR_MARK_Y },
            { x: CREATOR_MARK_X + CREATOR_MARK_WIDTH, y: CREATOR_MARK_Y },
            { x: CREATOR_MARK_X, y: CREATOR_MARK_Y + CREATOR_MARK_HEIGHT },
            { x: CREATOR_MARK_X + CREATOR_MARK_WIDTH, y: CREATOR_MARK_Y + CREATOR_MARK_HEIGHT },
        ]
        for (const corner of corners) expect(radiusOf(corner)).toBeLessThan(DISC_RADIUS)
    })

    it('is a shade wider than the readout disc, and no more', () => {
        expect(CREATOR_MARK_WIDTH).toBeCloseTo(CREATOR_MARK_WIDTH_RATIO * 2 * READOUT_DISC_RADIUS, 10)
        expect(CREATOR_MARK_WIDTH_RATIO).toBeGreaterThan(1)
        expect(CREATOR_MARK_WIDTH_RATIO).toBeLessThan(1.2)
    })
})
