import { describe, expect, it } from 'vitest'
import { MAX_SECONDS, SECONDS_PER_MINUTE } from '../app/lib/time'
import {
    expireIfElapsed,
    IDLE_TIMER,
    isElapsed,
    isTimerRequest,
    normalizeTimerRecord,
    reduceTimer,
    remainingFrom,
    type TimerRecord,
} from './timer'

const FIVE_MINUTES = 5 * SECONDS_PER_MINUTE
const SEVEN_MINUTES = 7 * SECONDS_PER_MINUTE

describe('timer record', () => {
    it('normalizes anything read from storage into a valid record', () => {
        expect(normalizeTimerRecord(null)).toEqual(IDLE_TIMER)
        expect(normalizeTimerRecord({ status: 'nope', muted: 'yes' })).toEqual(IDLE_TIMER)
    })

    it('downgrades a running record with no end time to paused', () => {
        const record = normalizeTimerRecord({ status: 'running', endTime: null, remainingSeconds: 90 })
        expect(record.status).toBe('paused')
        expect(record.remainingSeconds).toBe(90)
    })

    it('derives the remaining time from the absolute end time', () => {
        const start = 1_000_000
        const record = reduceTimer(IDLE_TIMER, { action: 'start', seconds: FIVE_MINUTES }, start)
        expect(record.status).toBe('running')
        expect(record.endTime).toBe(start + FIVE_MINUTES * 1000)
        expect(remainingFrom(record, start + SECONDS_PER_MINUTE * 1000)).toBeCloseTo(FIVE_MINUTES - 60, 3)
    })

    it('expires once the end time passes', () => {
        const record = reduceTimer(IDLE_TIMER, { action: 'start', seconds: 60 }, 0)
        expect(isElapsed(record, 59_000)).toBe(false)
        expect(isElapsed(record, 60_000)).toBe(true)
        expect(expireIfElapsed(record, 60_000).status).toBe('expired')
        expect(expireIfElapsed(record, 59_000).status).toBe('running')
    })

    it('pauses and resumes without losing time', () => {
        const start = 0
        let record = reduceTimer(IDLE_TIMER, { action: 'start', seconds: 120 }, start)
        record = reduceTimer(record, { action: 'pause' }, start + 30_000)

        expect(record.status).toBe('paused')
        expect(record.endTime).toBeNull()
        expect(record.remainingSeconds).toBeCloseTo(90, 3)

        record = reduceTimer(record, { action: 'resume' }, start + 90_000)
        expect(record.status).toBe('running')
        expect(record.endTime).toBe(start + 90_000 + 90_000)
    })

    it('resets to zero and forgets the last duration', () => {
        const running = reduceTimer(IDLE_TIMER, { action: 'start', seconds: FIVE_MINUTES }, 0)
        const record = reduceTimer(running, { action: 'reset' }, 0)
        expect(record).toEqual(IDLE_TIMER)
        expect(reduceTimer(record, { action: 'restart' }, 0)).toEqual(IDLE_TIMER)
    })

    it('restarts the last duration after it has rung', () => {
        const running = reduceTimer(IDLE_TIMER, { action: 'start', seconds: SEVEN_MINUTES }, 0)
        const expired = expireIfElapsed(running, SEVEN_MINUTES * 1000)
        expect(expired.status).toBe('expired')

        const restarted = reduceTimer(expired, { action: 'restart' }, 0)
        expect(restarted.status).toBe('running')
        expect(restarted.durationSeconds).toBe(SEVEN_MINUTES)
    })

    it('toggles mute independently of the countdown', () => {
        const muted = reduceTimer(IDLE_TIMER, { action: 'toggleMute' }, 0)
        expect(muted.muted).toBe(true)
        expect(muted.status).toBe('idle')
    })

    it('keeps the mute state across a reset', () => {
        const muted: TimerRecord = { ...IDLE_TIMER, muted: true }
        const running = reduceTimer(muted, { action: 'start', seconds: FIVE_MINUTES }, 0)
        expect(reduceTimer(running, { action: 'reset' }, 0).muted).toBe(true)
    })

    it('clamps a start beyond one revolution of the dial', () => {
        const record = reduceTimer(IDLE_TIMER, { action: 'start', seconds: 2 * MAX_SECONDS }, 0)
        expect(record.durationSeconds).toBe(MAX_SECONDS)
    })

    it('treats a zero duration as a reset', () => {
        const running = reduceTimer(IDLE_TIMER, { action: 'start', seconds: FIVE_MINUTES }, 0)
        expect(reduceTimer(running, { action: 'start', seconds: 0 }, 0)).toEqual(IDLE_TIMER)
    })

    it('coerces and drops an invalid ring time', () => {
        expect(normalizeTimerRecord({}).ringUntil).toBeNull()
        expect(normalizeTimerRecord({ ringUntil: 'soon' }).ringUntil).toBeNull()
        expect(normalizeTimerRecord({ ringUntil: Number.NaN }).ringUntil).toBeNull()
        expect(normalizeTimerRecord({ ringUntil: 12_345 }).ringUntil).toBe(12_345)
    })

    it('keeps the ring time when an expired record is resolved again', () => {
        const running = reduceTimer(IDLE_TIMER, { action: 'start', seconds: 60 }, 0)
        const ringing: TimerRecord = { ...running, ringUntil: 60_000 }
        expect(expireIfElapsed(ringing, 60_000).ringUntil).toBe(60_000)
    })

    it('arms no alarm when a new timer starts or a timer is reset', () => {
        const ringing: TimerRecord = { ...IDLE_TIMER, status: 'expired', ringUntil: 5_000 }
        expect(reduceTimer(ringing, { action: 'start', seconds: 60 }, 0).ringUntil).toBeNull()
        expect(reduceTimer(ringing, { action: 'reset' }, 0).ringUntil).toBeNull()
    })
})

describe('timer requests', () => {
    it('recognizes every action the UI can send', () => {
        for (const action of ['start', 'pause', 'resume', 'togglePause', 'reset', 'restart', 'toggleMute']) {
            expect(isTimerRequest({ action })).toBe(true)
        }
        expect(isTimerRequest({ action: 'start', seconds: 60 })).toBe(true)
    })

    it('rejects anything that is not a timer request', () => {
        const notRequests = [
            null,
            undefined,
            'start',
            {},
            { action: 'nope' },
            { target: 'offscreen', type: 'ring' },
            { target: 'worker', type: 'ring-ended' },
        ]
        for (const value of notRequests) expect(isTimerRequest(value)).toBe(false)
    })
})
