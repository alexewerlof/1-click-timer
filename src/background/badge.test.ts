import { describe, expect, it } from 'vitest'
import { SECONDS_PER_MINUTE } from '../app/lib/time'
import { IDLE_TIMER, type TimerRecord } from '../shared/timer'
import { badgeMinutesFor, badgePlanFor } from './badge'

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
