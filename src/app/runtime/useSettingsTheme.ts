import { useEffect } from 'react'
import { applyColorSlot } from '../design/palette'
import type { SettingsStore } from './settings'
import { useSettings } from './useSettings'

const DARK_QUERY = '(prefers-color-scheme: dark)'

/**
 * Applies the settings to the document: the light/dark theme (resolving Auto
 * from the OS preference) and the three colour-slot overrides. Runs on every
 * surface, so the popup, the tab and the settings screen all share one theme.
 */
export function useSettingsTheme(store: SettingsStore): void {
    const settings = useSettings(store)

    useEffect(() => {
        const root = document.documentElement

        function applyTheme(dark: boolean): void {
            root.dataset.theme = dark ? 'dark' : 'light'
        }

        if (settings.mode !== 'auto') {
            applyTheme(settings.mode === 'dark')
            return undefined
        }

        const media = window.matchMedia(DARK_QUERY)
        applyTheme(media.matches)
        const onChange = (event: MediaQueryListEvent) => applyTheme(event.matches)
        media.addEventListener('change', onChange)
        return () => media.removeEventListener('change', onChange)
    }, [settings.mode])

    useEffect(() => {
        applyColorSlot('face', settings.face)
        applyColorSlot('ticks', settings.ticks)
        applyColorSlot('remaining', settings.remaining)
    }, [settings.face, settings.ticks, settings.remaining])
}
