/**
 * How long the alarm rings, once the timer runs out (AGENTS.md "Notification").
 *
 * The alarm is a fixed menu of durations rather than a free number: a countdown
 * timer wants an alert that stops on its own, and five choices cover everything
 * from "a nudge" to "keep going until I notice". The value is stored in seconds
 * so it scales the same way every other duration in the app does.
 */

export type AlarmSeconds = 5 | 10 | 30 | 60 | 300

export interface AlarmDurationOption {
    seconds: AlarmSeconds
    label: string
}

/** The choices the settings screen offers, in display order. */
export const ALARM_DURATION_OPTIONS: readonly AlarmDurationOption[] = [
    { seconds: 5, label: '5 seconds' },
    { seconds: 10, label: '10 seconds' },
    { seconds: 30, label: '30 seconds' },
    { seconds: 60, label: '1 minute' },
    { seconds: 300, label: '5 minutes' },
]

/** Ten seconds of chime is enough to notice without becoming noise. */
export const DEFAULT_ALARM_SECONDS: AlarmSeconds = 10

export function isAlarmSeconds(value: unknown): value is AlarmSeconds {
    return ALARM_DURATION_OPTIONS.some((option) => option.seconds === value)
}

/** The label for a duration, e.g. `10 seconds` — falls back to its seconds. */
export function alarmSecondsLabel(seconds: AlarmSeconds): string {
    return ALARM_DURATION_OPTIONS.find((option) => option.seconds === seconds)?.label ?? `${seconds} seconds`
}
