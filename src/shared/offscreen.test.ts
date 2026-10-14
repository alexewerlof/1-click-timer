import { describe, expect, it } from 'vitest'
import { isOffscreenMessage, isRingEndedMessage, OFFSCREEN_DOCUMENT_PATH, WORKER_TARGET } from './offscreen'

describe('offscreen protocol', () => {
    it('names the bundled offscreen page', () => {
        expect(OFFSCREEN_DOCUMENT_PATH).toBe('offscreen.html')
    })

    it('recognizes messages addressed to the offscreen document', () => {
        expect(isOffscreenMessage({ target: 'offscreen', type: 'ring' })).toBe(true)
        expect(isOffscreenMessage({ target: 'offscreen', type: 'stop' })).toBe(true)
    })

    it('ignores messages for other targets', () => {
        expect(isOffscreenMessage({ target: WORKER_TARGET, type: 'ring-ended' })).toBe(false)
        expect(isOffscreenMessage({ action: 'start' })).toBe(false)
        expect(isOffscreenMessage(null)).toBe(false)
    })

    it('recognizes only the worker ring-ended report', () => {
        expect(isRingEndedMessage({ target: WORKER_TARGET, type: 'ring-ended' })).toBe(true)
        expect(isRingEndedMessage({ target: 'offscreen', type: 'ring' })).toBe(false)
        expect(isRingEndedMessage({ target: WORKER_TARGET, type: 'ring' })).toBe(false)
        expect(isRingEndedMessage(undefined)).toBe(false)
    })
})
