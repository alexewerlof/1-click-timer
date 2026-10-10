import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_SECONDS, SECONDS_PER_MINUTE } from '../lib/time'
import { createMockRuntime } from './mockRuntime'

const FIVE_MINUTES = 5 * SECONDS_PER_MINUTE
const SEVEN_MINUTES = 7 * SECONDS_PER_MINUTE

describe('mock timer runtime', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('counts down from an absolute end time', () => {
        const runtime = createMockRuntime()
        runtime.start(FIVE_MINUTES)

        expect(runtime.getState().status).toBe('running')
        expect(runtime.getState().durationSeconds).toBe(FIVE_MINUTES)
        expect(runtime.getState().lastDurationSeconds).toBe(FIVE_MINUTES)

        vi.advanceTimersByTime(SECONDS_PER_MINUTE * 1000)
        expect(runtime.getState().remainingSeconds).toBeCloseTo(FIVE_MINUTES - 60, 1)
    })

    it('expires once the remaining time reaches zero', () => {
        const runtime = createMockRuntime()
        runtime.start(60)
        vi.advanceTimersByTime(61_000)

        expect(runtime.getState().status).toBe('expired')
        expect(runtime.getState().remainingSeconds).toBe(0)
    })

    it('pauses and resumes without losing time', () => {
        const runtime = createMockRuntime()
        runtime.start(120)
        vi.advanceTimersByTime(30_000)

        runtime.togglePause()
        expect(runtime.getState().status).toBe('paused')

        vi.advanceTimersByTime(60_000)
        expect(runtime.getState().remainingSeconds).toBeCloseTo(90, 1)

        runtime.togglePause()
        expect(runtime.getState().status).toBe('running')

        vi.advanceTimersByTime(30_000)
        expect(runtime.getState().remainingSeconds).toBeCloseTo(60, 1)
    })

    it('resets to zero and forgets the last duration', () => {
        const runtime = createMockRuntime()
        runtime.start(FIVE_MINUTES)
        runtime.reset()

        const state = runtime.getState()
        expect(state.status).toBe('idle')
        expect(state.remainingSeconds).toBe(0)
        expect(state.durationSeconds).toBe(0)
        expect(state.lastDurationSeconds).toBeNull()

        runtime.restart()
        expect(runtime.getState().status).toBe('idle')
    })

    it('restarts the last duration after it has rung', () => {
        const runtime = createMockRuntime()
        runtime.start(SEVEN_MINUTES)
        vi.advanceTimersByTime(SEVEN_MINUTES * 1000)
        expect(runtime.getState().status).toBe('expired')

        runtime.restart()
        expect(runtime.getState().status).toBe('running')
        expect(runtime.getState().remainingSeconds).toBeCloseTo(SEVEN_MINUTES, 1)
    })

    it('mutes independently of the countdown', () => {
        const runtime = createMockRuntime()
        expect(runtime.getState().muted).toBe(false)

        runtime.toggleMute()
        expect(runtime.getState().muted).toBe(true)

        runtime.start(60)
        expect(runtime.getState().muted).toBe(true)

        runtime.toggleMute()
        expect(runtime.getState().muted).toBe(false)
    })

    it('clamps the duration to one revolution of the dial', () => {
        const runtime = createMockRuntime()
        runtime.start(2 * MAX_SECONDS)
        expect(runtime.getState().durationSeconds).toBe(MAX_SECONDS)
    })

    it('treats a zero duration as a reset', () => {
        const runtime = createMockRuntime()
        runtime.start(FIVE_MINUTES)
        runtime.start(0)

        expect(runtime.getState().status).toBe('idle')
        expect(runtime.getState().lastDurationSeconds).toBeNull()
    })

    it('notifies subscribers only while subscribed', () => {
        const runtime = createMockRuntime()
        const seen: string[] = []
        const unsubscribe = runtime.subscribe((state) => seen.push(state.status))

        runtime.start(60)
        expect(seen).toEqual(['running'])

        unsubscribe()
        runtime.toggleMute()
        expect(seen).toEqual(['running'])
    })
})
