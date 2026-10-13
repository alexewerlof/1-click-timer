import { describe, expect, it } from 'vitest'
import { ALARM_DURATION_OPTIONS, alarmSecondsLabel, DEFAULT_ALARM_SECONDS, isAlarmSeconds } from './alarm'

describe('alarm durations', () => {
    it('offers exactly the five documented options', () => {
        expect(ALARM_DURATION_OPTIONS.map((option) => option.seconds)).toEqual([5, 10, 30, 60, 300])
    })

    it('has a label for every option', () => {
        for (const option of ALARM_DURATION_OPTIONS) {
            expect(option.label.length).toBeGreaterThan(0)
            expect(alarmSecondsLabel(option.seconds)).toBe(option.label)
        }
    })

    it('defaults to ten seconds and offers it', () => {
        expect(DEFAULT_ALARM_SECONDS).toBe(10)
        expect(ALARM_DURATION_OPTIONS.some((option) => option.seconds === DEFAULT_ALARM_SECONDS)).toBe(true)
    })

    it('accepts only the offered seconds', () => {
        for (const option of ALARM_DURATION_OPTIONS) {
            expect(isAlarmSeconds(option.seconds)).toBe(true)
        }
        for (const value of [0, 1, 15, 45, 120, 301, -10, Number.NaN, 'ten', null, undefined]) {
            expect(isAlarmSeconds(value)).toBe(false)
        }
    })

    it('labels an unknown duration by its seconds', () => {
        expect(alarmSecondsLabel(7 as never)).toBe('7 seconds')
    })
})
