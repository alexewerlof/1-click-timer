import { SettingsApp } from './SettingsApp'
import { TimerSurface } from './TimerSurface'
import { readSurface } from './lib/surface'
import { timerRuntime } from './runtime/runtime'
import { settingsStore } from './runtime/settingsRuntime'
import { useSettingsTheme } from './runtime/useSettingsTheme'

/** Picks the screen from the surface the HTML entry declares. */
export function App() {
    const surface = readSurface()
    // One theme for every screen: popup, tab and settings.
    useSettingsTheme(settingsStore)

    if (surface === 'settings') return <SettingsApp settingsStore={settingsStore} />
    return <TimerSurface surface={surface} runtime={timerRuntime} settingsStore={settingsStore} />
}
