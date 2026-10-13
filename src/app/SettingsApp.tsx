import type { CSSProperties, ReactNode } from 'react'
import { Bug, RotateCcw, SquareCode, User, X } from 'lucide-react'
import { SLOT_LABELS, SWATCHES, type Swatch } from './design/palette'
import { ALARM_DURATION_OPTIONS, isAlarmSeconds } from './lib/alarm'
import { CHIME_OPTIONS, previewChime, primeAudio, type ChimeId } from './lib/chimes'
import { AUTHOR_SITE_URL, ISSUES_URL, REPOSITORY_URL, openTab } from './lib/links'
import {
    COLOR_SLOTS,
    THEME_MODES,
    type ColorSlot,
    type SettingsStore,
    type ThemeMode,
    type TimerSettings,
} from './runtime/settings'
import { useSettings } from './runtime/useSettings'
import styles from './SettingsApp.module.css'

export interface SettingsAppProps {
    settingsStore: SettingsStore
}

const MODE_LABELS: Record<ThemeMode, string> = {
    auto: 'Auto',
    light: 'Light',
    dark: 'Dark',
}

function isChimeId(value: string): value is ChimeId {
    return CHIME_OPTIONS.some((option) => option.id === value)
}

/**
 * The settings screen (AGENTS.md "Settings"): appearance, the alarm, and the three
 * colour slots, closing with a footer of actions — reset to defaults, and the
 * three ways out (the author's site, the source code and the bug tracker). It
 * runs on its own surface (`settings.html`) opened from the face's gear control.
 */
export function SettingsApp({ settingsStore }: SettingsAppProps) {
    const settings = useSettings(settingsStore)

    function update(patch: Partial<TimerSettings>): void {
        settingsStore.update(patch)
    }

    function chooseColor(slot: ColorSlot, value: string | null): void {
        const patch: Partial<TimerSettings> = {}
        patch[slot] = value
        update(patch)
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
                <div className={styles.modes} role="radiogroup" aria-label="Appearance">
                    {THEME_MODES.map((mode) => (
                        <button
                            key={mode}
                            type="button"
                            role="radio"
                            aria-checked={settings.mode === mode}
                            className={styles.mode}
                            data-selected={settings.mode === mode}
                            onClick={() => update({ mode })}
                        >
                            {MODE_LABELS[mode]}
                        </button>
                    ))}
                </div>
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
                        Chime
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
                        className={styles.button}
                        onClick={previewAlarm}
                        disabled={settings.chime === 'silent'}
                    >
                        Preview
                    </button>
                </div>

                <div className={styles.fieldRow}>
                    <label className={styles.fieldLabel} htmlFor="alarm-seconds">
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

            <section className={styles.panel} aria-labelledby="colours-title">
                <h2 id="colours-title" className={styles.panelTitle}>
                    Colours
                </h2>
                {COLOR_SLOTS.map((slot) => (
                    <div className={styles.fieldRow} key={slot}>
                        <span className={styles.fieldLabel}>{SLOT_LABELS[slot]}</span>
                        <div className={styles.swatches} role="radiogroup" aria-label={SLOT_LABELS[slot]}>
                            {SWATCHES[slot].map((swatch) => (
                                <SwatchButton
                                    key={swatch.label}
                                    swatch={swatch}
                                    selected={settings[slot] === swatch.value}
                                    onSelect={() => chooseColor(slot, swatch.value)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
                <p className={styles.hint}>"Auto" follows the light or dark theme.</p>
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
    swatch: Swatch
    selected: boolean
    onSelect: () => void
}

/** One colour choice: a chip for a colour, a pill for the Auto option. */
function SwatchButton({ swatch, selected, onSelect }: SwatchButtonProps) {
    const auto = swatch.value === null
    return (
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={swatch.label}
            title={swatch.label}
            className={styles.swatch}
            data-selected={selected}
            data-auto={auto}
            style={auto ? undefined : ({ '--swatch': swatch.value } as CSSProperties)}
            onClick={onSelect}
        >
            {auto ? 'Auto' : ''}
        </button>
    )
}
