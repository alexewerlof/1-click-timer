import { describe, expect, it } from 'vitest'
import { MAX_SECONDS, clampSeconds, formatClock } from './time'

describe('clampSeconds', () => {
    it('clamps to the dial range', () => {
        expect(clampSeconds(-30)).toBe(0)
        expect(clampSeconds(0)).toBe(0)
        expect(clampSeconds(90)).toBe(90)
        expect(clampSeconds(MAX_SECONDS + 1)).toBe(MAX_SECONDS)
    })

    it('treats a non-finite duration as zero', () => {
        expect(clampSeconds(Number.NaN)).toBe(0)
        expect(clampSeconds(Number.POSITIVE_INFINITY)).toBe(0)
    })
})

describe('formatClock', () => {
    it('formats the remaining time as M:SS', () => {
        expect(formatClock(0)).toBe('0:00')
        expect(formatClock(5)).toBe('0:05')
        expect(formatClock(65)).toBe('1:05')
        expect(formatClock(600)).toBe('10:00')
        expect(formatClock(3599)).toBe('59:59')
        expect(formatClock(MAX_SECONDS)).toBe('60:00')
    })

    it('counts down, so fractions floor instead of rounding up', () => {
        expect(formatClock(65.9)).toBe('1:05')
        expect(formatClock(0.4)).toBe('0:00')
    })

    it('never shows a negative time', () => {
        expect(formatClock(-5)).toBe('0:00')
    })
})
