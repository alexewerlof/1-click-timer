/**
 * Time helpers shared by the timer UI.
 *
 * The dial is a full 60-minute revolution, so a timer can never exceed
 * `MAX_SECONDS` — this is the single source of truth for that clamp.
 */

export const MAX_MINUTES = 60
export const SECONDS_PER_MINUTE = 60
export const MAX_SECONDS = MAX_MINUTES * SECONDS_PER_MINUTE

/** Clamps an arbitrary duration into the range the dial can represent. */
export function clampSeconds(seconds: number): number {
    if (!Number.isFinite(seconds)) return 0
    return Math.min(MAX_SECONDS, Math.max(0, seconds))
}

/**
 * Formats a duration as `M:SS` — the digital readout in the middle of the face.
 * Counts down, so the last partial second shows as `0:00`.
 */
export function formatClock(seconds: number): string {
    const whole = Math.floor(clampSeconds(seconds))
    const minutes = Math.floor(whole / SECONDS_PER_MINUTE)
    const rest = whole % SECONDS_PER_MINUTE
    return `${minutes}:${String(rest).padStart(2, '0')}`
}

/** Whole minutes remaining, rounded up, so a running timer never reads `0m`. */
export function toWholeMinutes(seconds: number): number {
    return Math.ceil(clampSeconds(seconds) / SECONDS_PER_MINUTE)
}
