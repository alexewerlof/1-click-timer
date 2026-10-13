import { describe, expect, it } from 'vitest'
import { ALARM_DURATION_OPTIONS, DEFAULT_ALARM_SECONDS } from '../lib/alarm'
import { CHIME_OPTIONS, DEFAULT_CHIME } from '../lib/chimes'
import { createMockSettings } from './mockSettings'
import { DEFAULT_SETTINGS, normalizeSettings } from './settings'

describe('settings', () => {
    it('starts from the factory defaults', () => {
        expect(createMockSettings().getState()).toEqual(DEFAULT_SETTINGS)
        expect(DEFAULT_SETTINGS.mode).toBe('auto')
        expect(DEFAULT_SETTINGS.volume).toBe(1)
        expect(DEFAULT_CHIME).toBe('chime')
        expect(DEFAULT_SETTINGS.alarmSeconds).toBe(DEFAULT_ALARM_SECONDS)
    })

    it('merges a patch and notifies subscribers', () => {
        const store = createMockSettings()
        const seen: string[] = []
        const unsubscribe = store.subscribe((settings) => seen.push(settings.mode))

        store.update({ mode: 'dark' })
        expect(store.getState().mode).toBe('dark')
        expect(seen).toEqual(['dark'])

        unsubscribe()
        store.update({ mode: 'light' })
        expect(seen).toEqual(['dark'])
    })

    it('resets to the factory settings', () => {
        const store = createMockSettings({ mode: 'dark', volume: 0.2, remaining: '#000000' })
        store.reset()
        expect(store.getState()).toEqual(DEFAULT_SETTINGS)
    })

    it('coerces invalid stored values back to defaults', () => {
        const settings = normalizeSettings({ mode: 'sepia', volume: 5, chime: 'gong', face: 42 })
        expect(settings.mode).toBe('auto')
        expect(settings.volume).toBe(1)
        expect(settings.chime).toBe('chime')
        expect(settings.face).toBeNull()
    })

    it('accepts every chime the settings screen offers', () => {
        for (const option of CHIME_OPTIONS) {
            expect(normalizeSettings({ chime: option.id }).chime).toBe(option.id)
        }
    })

    it('accepts every alarm duration the settings screen offers', () => {
        for (const option of ALARM_DURATION_OPTIONS) {
            expect(normalizeSettings({ alarmSeconds: option.seconds }).alarmSeconds).toBe(option.seconds)
        }
    })

    it('coerces an unknown alarm duration back to the default', () => {
        expect(normalizeSettings({ alarmSeconds: 42 }).alarmSeconds).toBe(DEFAULT_ALARM_SECONDS)
        expect(normalizeSettings({ alarmSeconds: 'soon' }).alarmSeconds).toBe(DEFAULT_ALARM_SECONDS)
        expect(normalizeSettings({}).alarmSeconds).toBe(DEFAULT_ALARM_SECONDS)
    })

    it('clamps a volume below zero', () => {
        expect(normalizeSettings({ volume: -2 }).volume).toBe(0)
    })
})
