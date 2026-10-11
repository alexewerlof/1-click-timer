import { describe, expect, it } from 'vitest'
import { SECONDS_PER_MINUTE } from '../app/lib/time'
import { IDLE_TIMER, type TimerRecord } from '../shared/timer'
import { badgeColorFor, badgeMinutesFor, badgePlanFor } from './badge'

const GREEN = 'rgb(11, 128, 67)'
const ORANGE = 'rgb(232, 113, 10)'
const RED = 'rgb(224, 32, 27)'
const GREY = 'rgb(107, 114, 128)'

function running(durationSeconds: number): TimerRecord {
    return {
        ...IDLE_TIMER,
        status: 'running',
        endTime: 0,
        durationSeconds,
        remainingSeconds: durationSeconds,
    }
}

/** The green channel of a badge colour — the ink that drains as time runs out. */
function greenChannel(fraction: number): number {
    return Number(/rgb\(\d+, (\d+)/.exec(badgeColorFor(fraction))?.[1])
}

describe('badgeMinutesFor', () => {
    it('floors to whole minutes, so 1:05 left shows as 1', () => {
        expect(badgeMinutesFor(0)).toBe(0)
        expect(badgeMinutesFor(59)).toBe(0)
        expect(badgeMinutesFor(SECONDS_PER_MINUTE)).toBe(1)
        expect(badgeMinutesFor(65)).toBe(1)
        expect(badgeMinutesFor(30 * SECONDS_PER_MINUTE)).toBe(30)
    })

    it('never shows a negative or fractional minute', () => {
        expect(badgeMinutesFor(-10)).toBe(0)
        expect(badgeMinutesFor(119.9)).toBe(1)
    })
})

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

describe('badgePlanFor', () => {
    it('shows whole minutes for a running timer', () => {
        expect(badgePlanFor(running(30 * SECONDS_PER_MINUTE), 65)).toEqual({ text: '1', color: expect.any(String) })
    })

    it('colours a timer by the fraction of its own duration that is left', () => {
        expect(badgePlanFor(running(30 * SECONDS_PER_MINUTE), 30 * SECONDS_PER_MINUTE).color).toBe(GREEN)
        expect(badgePlanFor(running(3 * SECONDS_PER_MINUTE), 3 * SECONDS_PER_MINUTE).color).toBe(GREEN)
        expect(badgePlanFor(running(30 * SECONDS_PER_MINUTE), 15 * SECONDS_PER_MINUTE).color).toBe(ORANGE)
        expect(badgePlanFor(running(3 * SECONDS_PER_MINUTE), 90).color).toBe(ORANGE)
        expect(badgePlanFor(running(3 * SECONDS_PER_MINUTE), 0).color).toBe(RED)
    })

    it('greys a paused timer', () => {
        const paused: TimerRecord = { ...running(600), status: 'paused', endTime: null, remainingSeconds: 95 }
        expect(badgePlanFor(paused, 95)).toEqual({ text: '1', color: GREY })
    })

    it('clears the badge when the timer is up or idle', () => {
        const expired: TimerRecord = { ...running(60), status: 'expired', endTime: null, remainingSeconds: 0 }
        expect(badgePlanFor(expired, 0).text).toBe('')
        expect(badgePlanFor(IDLE_TIMER, 0).text).toBe('')
    })
})
