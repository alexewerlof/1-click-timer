import { describe, expect, it } from 'vitest'
import { IDLE_TIMER, type TimerRecord } from '../shared/timer'
import { ringingNow, toolbarIconFor } from './alarm'

/** An expired record that is ringing until `ringUntil` (default 1000 ms). */
function expired(overrides: Partial<TimerRecord> = {}): TimerRecord {
    return { ...IDLE_TIMER, status: 'expired', ringUntil: 1000, ...overrides }
}

describe('ringingNow', () => {
    it('rings while expired, un-muted and inside the ring window', () => {
        expect(ringingNow(expired(), 0)).toBe(true)
        expect(ringingNow(expired(), 999)).toBe(true)
    })

    it('stops the moment ringUntil is reached', () => {
        expect(ringingNow(expired(), 1000)).toBe(false)
        expect(ringingNow(expired(), 1001)).toBe(false)
    })

    it('does not ring when muted', () => {
        expect(ringingNow(expired({ muted: true }), 0)).toBe(false)
    })

    it('does not ring when the ring was never armed', () => {
        // Silent chime or zero volume: the worker leaves ringUntil null.
        expect(ringingNow(expired({ ringUntil: null }), 0)).toBe(false)
    })

    it('does not ring while running, paused or idle', () => {
        expect(ringingNow({ ...IDLE_TIMER, status: 'running', endTime: 5000 }, 0)).toBe(false)
        expect(ringingNow({ ...IDLE_TIMER, status: 'paused', remainingSeconds: 10 }, 0)).toBe(false)
        expect(ringingNow(IDLE_TIMER, 0)).toBe(false)
    })
})

describe('toolbarIconFor', () => {
    it('shows the alert icon exactly while the alarm rings', () => {
        expect(toolbarIconFor(expired(), 0)).toBe('alert')
        expect(toolbarIconFor(expired(), 1000)).toBe('normal')
        expect(toolbarIconFor(expired({ muted: true }), 0)).toBe('normal')
    })

    it('shows the dial icon otherwise', () => {
        expect(toolbarIconFor(IDLE_TIMER, 0)).toBe('normal')
        expect(toolbarIconFor({ ...IDLE_TIMER, status: 'running', endTime: 1000 }, 0)).toBe('normal')
    })
})
