import { describe, expect, it } from 'vitest'
import { IDLE_TIMER, reduceTimer } from '../../shared/timer'
import { SECONDS_PER_MINUTE } from '../lib/time'
import { toTimerState } from './timerState'

describe('record → UI state', () => {
    it('maps a running record to a running state', () => {
        const record = reduceTimer(IDLE_TIMER, { action: 'start', seconds: 30 * SECONDS_PER_MINUTE }, 0)
        const state = toTimerState(record, 60_000)

        expect(state.status).toBe('running')
        expect(state.remainingSeconds).toBeCloseTo(29 * SECONDS_PER_MINUTE, 3)
        expect(state.durationSeconds).toBe(30 * SECONDS_PER_MINUTE)
        expect(state.lastDurationSeconds).toBe(30 * SECONDS_PER_MINUTE)
    })

    it('resolves an elapsed record to expired with no remaining time', () => {
        const record = reduceTimer(IDLE_TIMER, { action: 'start', seconds: 60 }, 0)
        const state = toTimerState(record, 61_000)

        expect(state.status).toBe('expired')
        expect(state.remainingSeconds).toBe(0)
    })

    it('carries the mute flag through', () => {
        const record = reduceTimer(IDLE_TIMER, { action: 'toggleMute' }, 0)
        expect(toTimerState(record, 0).muted).toBe(true)
    })
})
