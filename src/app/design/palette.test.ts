import { describe, expect, it } from 'vitest'
import { REMAINING_CALM, REMAINING_HALFWAY, REMAINING_URGENT } from '../../shared/remainingColor'
import { accentColorFor, conicGradientFor, fixedRemainingColor, swatchBackground } from './palette'

describe('fixedRemainingColor', () => {
    it('pins the two flat choices and leaves the ramps to the theme', () => {
        expect(fixedRemainingColor('red')).toBe(REMAINING_URGENT)
        expect(fixedRemainingColor('green')).toBe(REMAINING_CALM)
        expect(fixedRemainingColor('gradient')).toBeNull()
        expect(fixedRemainingColor('conic')).toBeNull()
    })
})

describe('accentColorFor', () => {
    it('is the calm green for Red and Green, and the theme red for the ramps', () => {
        expect(accentColorFor('red')).toBe(REMAINING_CALM)
        expect(accentColorFor('green')).toBe(REMAINING_CALM)
        expect(accentColorFor('gradient')).toBeNull()
        expect(accentColorFor('conic')).toBeNull()
    })
})

describe('swatchBackground', () => {
    it('paints the flat choices in their colour and Gradient as a vertical ramp', () => {
        expect(swatchBackground('red')).toBe(REMAINING_URGENT)
        expect(swatchBackground('green')).toBe(REMAINING_CALM)
        expect(swatchBackground('gradient')).toBe(
            `linear-gradient(0deg, ${REMAINING_CALM}, ${REMAINING_HALFWAY}, ${REMAINING_URGENT})`,
        )
    })

    it('paints Conic as a wheel of the same three stops, seam at 12 o’clock', () => {
        expect(swatchBackground('conic')).toBe(
            `conic-gradient(${REMAINING_CALM}, ${REMAINING_HALFWAY}, ${REMAINING_URGENT})`,
        )
    })
})

describe('conicGradientFor', () => {
    it('sweeps the ramp from green at the duration round to red at 12 o’clock', () => {
        // A 15-minute timer: green at 270° (9 o'clock), orange half way (315°),
        // red at 360° (12 o'clock), exactly where its sector starts and ends.
        expect(conicGradientFor(15 * 60)).toBe(
            `conic-gradient(${REMAINING_CALM} 0deg, ${REMAINING_CALM} 270deg, ${REMAINING_HALFWAY} 315deg, ${REMAINING_URGENT} 360deg)`,
        )
    })

    it('spans a whole turn for a whole-hour timer, and clamps beyond it', () => {
        expect(conicGradientFor(60 * 60)).toBe(
            `conic-gradient(${REMAINING_CALM} 0deg, ${REMAINING_CALM} 0deg, ${REMAINING_HALFWAY} 180deg, ${REMAINING_URGENT} 360deg)`,
        )
        expect(conicGradientFor(120 * 60)).toBe(conicGradientFor(60 * 60))
        expect(conicGradientFor(-5)).toBe(conicGradientFor(0))
    })
})
