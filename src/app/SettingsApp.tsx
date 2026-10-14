import type { CSSProperties, ReactNode } from 'react'
import { Bell, Bug, Hourglass, Play, RotateCcw, SquareCode, User, X } from 'lucide-react'
import { REMAINING_SWATCHES, swatchBackground, type RemainingSwatch } from './design/palette'
import { ALARM_DURATION_OPTIONS, isAlarmSeconds } from './lib/alarm'
import { CHIME_OPTIONS, previewChime, primeAudio, type ChimeId } from './lib/chimes'
import { AUTHOR_SITE_URL, ISSUES_URL, REPOSITORY_URL, openTab } from './lib/links'
import { isThemeMode, THEME_MODES, type SettingsStore, type ThemeMode, type TimerSettings } from './runtime/settings'
import { useRemainingColor } from './runtime/useRemainingColor'
import { useSettings } from './runtime/useSettings'
import styles from './SettingsApp.module.css'

export interface SettingsAppProps {
    settingsStore: SettingsStore
}

const MODE_LABELS: Record<ThemeMode, string> = {
    light: 'Light',
    dark: 'Dark',
    device: 'Device',
}

function isChimeId(value: string): value is ChimeId {
    return CHIME_OPTIONS.some((option) => option.id === value)
}

/**
 * The settings screen (AGENTS.md "Settings"): appearance (the mode and the
 * remaining-time colour) and the alarm, closing with a footer of actions — reset
 * to defaults, and the three ways out (the author's site, the source code and
 * the bug tracker). It runs on its own surface (`settings.html`) opened from the
 * face's gear control.
 */
export function SettingsApp({ settingsStore }: SettingsAppProps) {
    const settings = useSettings(settingsStore)
    // No timer on this surface, so the remaining colour falls back to the theme's.
    useRemainingColor(settingsStore, null)

    function update(patch: Partial<TimerSettings>): void {
        settingsStore.update(patch)
    }

    function previewAlarm(): void {
        primeAudio()
        previewChime(settings.chime, settings.volume)
    }

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Settings</h1>
                <button
                    type="button"
                    className={styles.close}
                    onClick={() => window.close()}
                    aria-label="Close settings"
                    title="Close"
                >
                    <X aria-hidden />
                </button>
            </header>

            <section className={styles.panel} aria-labelledby="appearance-title">
                <h2 id="appearance-title" className={styles.panelTitle}>
                    Appearance
                </h2>
                <div className={styles.fieldRow}>
                    <label className={styles.fieldLabel} htmlFor="mode">
                        Mode
                    </label>
                    <select
                        id="mode"
                        className={styles.select}
                        value={settings.mode}
                        onChange={(event) => {
                            const value = event.target.value
                            if (isThemeMode(value)) update({ mode: value })
                        }}
                    >
                        {THEME_MODES.map((mode) => (
                            <option key={mode} value={mode}>
                                {MODE_LABELS[mode]}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>Remaining</span>
                    <div className={styles.swatches} role="radiogroup" aria-label="Remaining time colour">
                        {REMAINING_SWATCHES.map((swatch) => (
                            <SwatchButton
                                key={swatch.value}
                                swatch={swatch}
                                selected={settings.remaining === swatch.value}
                                onSelect={() => update({ remaining: swatch.value })}
                            />
                        ))}
                    </div>
                </div>
                <p className={styles.hint}>
                    “Conic” sweeps green → orange → red as the sector shrinks; “Gradient” follows the time left, like
                    the toolbar badge.
                </p>
            </section>

            <section className={styles.panel} aria-labelledby="alarm-title">
                <h2 id="alarm-title" className={styles.panelTitle}>
                    Alarm
                </h2>

                <div className={styles.field}>
                    <div className={styles.fieldRow}>
                        <label className={styles.fieldLabel} htmlFor="volume">
                            Volume
                        </label>
                        <span className={styles.value}>{Math.round(settings.volume * 100)}%</span>
                    </div>
                    <input
                        id="volume"
                        className={styles.slider}
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={settings.volume}
                        onChange={(event) => update({ volume: Number(event.target.value) })}
                    />
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.fieldLabel} htmlFor="chime">
                        <Bell aria-hidden />
                        Sound
                    </label>
                    <select
                        id="chime"
                        className={styles.select}
                        value={settings.chime}
                        onChange={(event) => {
                            const value = event.target.value
                            if (isChimeId(value)) update({ chime: value })
                        }}
                    >
                        {CHIME_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        className={styles.iconButton}
                        onClick={previewAlarm}
                        disabled={settings.chime === 'silent'}
                        aria-label="Preview"
                        title="Preview"
                    >
                        <Play aria-hidden />
                    </button>
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.fieldLabel} htmlFor="alarm-seconds">
                        <Hourglass aria-hidden />
                        Ring for
                    </label>
                    <select
                        id="alarm-seconds"
                        className={styles.select}
                        value={settings.alarmSeconds}
                        onChange={(event) => {
                            const seconds = Number(event.target.value)
                            if (isAlarmSeconds(seconds)) update({ alarmSeconds: seconds })
                        }}
                    >
                        {ALARM_DURATION_OPTIONS.map((option) => (
                            <option key={option.seconds} value={option.seconds}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            <footer className={styles.footer}>
                <FooterButton
                    icon={<RotateCcw aria-hidden />}
                    label="Reset to defaults"
                    onClick={() => settingsStore.reset()}
                />
                <FooterButton
                    icon={<User aria-hidden />}
                    label="About the author"
                    onClick={() => openTab(AUTHOR_SITE_URL)}
                />
                <FooterButton
                    icon={<SquareCode aria-hidden />}
                    label="Source code"
                    onClick={() => openTab(REPOSITORY_URL)}
                />
                <FooterButton icon={<Bug aria-hidden />} label="Report a bug" onClick={() => openTab(ISSUES_URL)} />
            </footer>
        </main>
    )
}

interface FooterButtonProps {
    /** The glyph, always decorative: the label carries the meaning. */
    icon: ReactNode
    label: string
    onClick: () => void
}

/** One footer action: a Lucide glyph and its label, side by side. */
function FooterButton({ icon, label, onClick }: FooterButtonProps) {
    return (
        <button type="button" className={styles.button} onClick={onClick}>
            {icon}
            {label}
        </button>
    )
}

interface SwatchButtonProps {
    swatch: RemainingSwatch
    selected: boolean
    onSelect: () => void
}

/** One remaining-colour choice: a chip painted with the colour, or the ramp. */
function SwatchButton({ swatch, selected, onSelect }: SwatchButtonProps) {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={swatch.label}
            title={swatch.label}
            className={styles.swatch}
            data-selected={selected}
            style={{ '--swatch': swatchBackground(swatch.value) } as CSSProperties}
            onClick={onSelect}
        />
    )
}
