import { useEffect } from 'react'
import type { SettingsStore } from './settings'
import { useSettings } from './useSettings'

const DARK_QUERY = '(prefers-color-scheme: dark)'

/**
 * Applies the light/dark theme to the document, resolving Device from the OS
 * preference. Runs on every surface, so the popup, the tab and the settings
 * screen all share one theme. The remaining-time colour is applied separately by
 * `useRemainingColor`, which also needs the timer's own state.
 */
export function useSettingsTheme(store: SettingsStore): void {
    const settings = useSettings(store)

    useEffect(() => {
        const root = document.documentElement

        function applyTheme(dark: boolean): void {
            root.dataset.theme = dark ? 'dark' : 'light'
        }

        if (settings.mode !== 'device') {
            applyTheme(settings.mode === 'dark')
            return undefined
        }

        const media = window.matchMedia(DARK_QUERY)
        applyTheme(media.matches)
        const onChange = (event: MediaQueryListEvent) => applyTheme(event.matches)
        media.addEventListener('change', onChange)
        return () => media.removeEventListener('change', onChange)
    }, [settings.mode])
}
