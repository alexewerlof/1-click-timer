import { describe, expect, it } from 'vitest'
import { REMAINING_CALM, REMAINING_HALFWAY, REMAINING_URGENT } from '../../shared/remainingColor'
import { accentColorFor, fixedRemainingColor, swatchBackground } from './palette'

describe('fixedRemainingColor', () => {
    it('pins the two flat choices and leaves Gradient to the theme', () => {
        expect(fixedRemainingColor('red')).toBe(REMAINING_URGENT)
        expect(fixedRemainingColor('green')).toBe(REMAINING_CALM)
        expect(fixedRemainingColor('gradient')).toBeNull()
    })
})

describe('accentColorFor', () => {
    it('is the calm green for Red and Green, and the theme red for Gradient', () => {
        expect(accentColorFor('red')).toBe(REMAINING_CALM)
        expect(accentColorFor('green')).toBe(REMAINING_CALM)
        expect(accentColorFor('gradient')).toBeNull()
    })
})

describe('swatchBackground', () => {
    it('paints the flat choices in their colour and Gradient as a horizontal ramp', () => {
        expect(swatchBackground('red')).toBe(REMAINING_URGENT)
        expect(swatchBackground('green')).toBe(REMAINING_CALM)
        expect(swatchBackground('gradient')).toBe(
            `linear-gradient(90deg, ${REMAINING_URGENT}, ${REMAINING_HALFWAY}, ${REMAINING_CALM})`,
        )
    })
})
