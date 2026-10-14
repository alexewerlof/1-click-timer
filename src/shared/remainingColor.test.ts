import { describe, expect, it } from 'vitest'
import { badgeColorFor, remainingColorFor, REMAINING_PAUSED } from './remainingColor'

const GREEN = 'rgb(11, 128, 67)'
const ORANGE = 'rgb(232, 113, 10)'
const RED = 'rgb(224, 32, 27)'
const GREY = 'rgb(107, 114, 128)'

/** The green channel of a ramp colour — the ink that drains as time runs out. */
function greenChannel(fraction: number): number {
    return Number(/rgb\(\d+, (\d+)/.exec(badgeColorFor(fraction))?.[1])
}

describe('badgeColorFor', () => {
    it('is green at the start and red when the time is up', () => {
        expect(badgeColorFor(1)).toBe(GREEN)
        expect(badgeColorFor(0)).toBe(RED)
    })

    it('passes through orange at the halfway point', () => {
        expect(badgeColorFor(0.5)).toBe(ORANGE)
    })

    it('clamps out-of-range fractions', () => {
        expect(badgeColorFor(2)).toBe(GREEN)
        expect(badgeColorFor(-1)).toBe(RED)
    })

    it('gets redder as the time runs out', () => {
        expect(greenChannel(1)).toBeGreaterThan(greenChannel(0.75))
        expect(greenChannel(0.75)).toBeGreaterThan(greenChannel(0.5))
        expect(greenChannel(0.5)).toBeGreaterThan(greenChannel(0.25))
        expect(greenChannel(0.25)).toBeGreaterThan(greenChannel(0))
    })
})

describe('remainingColorFor', () => {
    it('runs the ramp while the timer is running', () => {
        expect(remainingColorFor('running', 1)).toBe(badgeColorFor(1))
        expect(remainingColorFor('running', 0.5)).toBe(badgeColorFor(0.5))
        expect(remainingColorFor('running', 0)).toBe(badgeColorFor(0))
    })

    it('greys a paused timer, whatever its fraction', () => {
        expect(remainingColorFor('paused', 0.9)).toBe(GREY)
        expect(remainingColorFor('paused', 0)).toBe(GREY)
    })

    it('is red when the time is up and green while idle', () => {
        expect(remainingColorFor('expired', 0)).toBe(RED)
        expect(remainingColorFor('idle', 0)).toBe(GREEN)
    })
})

/**
 * The paused grey is exported as a stop of its own so the Conic sector can pin the
 * same ink the ramp gives a pause (AGENTS.md "Remaining sector").
 */
describe('REMAINING_PAUSED', () => {
    it('is the grey a paused timer wears', () => {
        expect(REMAINING_PAUSED).toBe(GREY)
        expect(REMAINING_PAUSED).toBe(remainingColorFor('paused', 0.5))
    })
})
