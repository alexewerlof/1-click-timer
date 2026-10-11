/**
 * The timer protocol shared by the service worker and the UI runtime.
 *
 * The persisted record is the single source of truth: it holds an absolute
 * `endTime`, so the remaining time is always derived, never accumulated — which
 * is what lets the timer survive service-worker termination (README "Manifest V3
 * architecture"). The reducer here is pure, so the worker, the UI and the tests
 * all agree on what an action does.
 */

import { clampSeconds } from '../app/lib/time'

/** The `chrome.storage.local` key the record lives under. */
export const TIMER_STORAGE_KEY = 'timerState'

export type TimerStatus = 'idle' | 'running' | 'paused' | 'expired'

export interface TimerRecord {
    status: TimerStatus
    /** Absolute ms timestamp the countdown ends at, while running. */
    endTime: number | null
    /** Snapshot of the remaining time, kept while paused (zero otherwise). */
    remainingSeconds: number
    durationSeconds: number
    lastDurationSeconds: number | null
    muted: boolean
}

export const IDLE_TIMER: TimerRecord = {
    status: 'idle',
    endTime: null,
    remainingSeconds: 0,
    durationSeconds: 0,
    lastDurationSeconds: null,
    muted: false,
}

export type TimerAction = 'start' | 'pause' | 'resume' | 'togglePause' | 'reset' | 'restart' | 'toggleMute'

export interface TimerRequest {
    action: TimerAction
    seconds?: number
}

export interface TimerResponse {
    ok: boolean
    error?: string
}

const STATUSES: readonly TimerStatus[] = ['idle', 'running', 'paused', 'expired']

function numberOr(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/** Coerces anything read from storage into a valid record. */
export function normalizeTimerRecord(raw: unknown): TimerRecord {
    const source = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
    const status = STATUSES.includes(source.status as TimerStatus) ? (source.status as TimerStatus) : 'idle'
    const endTime = typeof source.endTime === 'number' && Number.isFinite(source.endTime) ? source.endTime : null
    // A running record without an end time is unrecoverable; keep its remaining
    // time as a paused timer instead of pretending it is still counting.
    const resolvedStatus: TimerStatus = status === 'running' && endTime === null ? 'paused' : status
    return {
        status: resolvedStatus,
        endTime: resolvedStatus === 'running' ? endTime : null,
        remainingSeconds: Math.max(0, numberOr(source.remainingSeconds, 0)),
        durationSeconds: Math.max(0, numberOr(source.durationSeconds, 0)),
        lastDurationSeconds:
            typeof source.lastDurationSeconds === 'number' && Number.isFinite(source.lastDurationSeconds)
                ? source.lastDurationSeconds
                : null,
        muted: source.muted === true,
    }
}

/** The remaining seconds for a record at `now`. */
export function remainingFrom(record: TimerRecord, now: number): number {
    if (record.status === 'running' && record.endTime !== null) {
        return Math.max(0, (record.endTime - now) / 1000)
    }
    return Math.max(0, record.remainingSeconds)
}

export function isElapsed(record: TimerRecord, now: number): boolean {
    return record.status === 'running' && remainingFrom(record, now) <= 0
}

/** The record with a running timer that has run out moved to `expired`. */
export function expireIfElapsed(record: TimerRecord, now: number): TimerRecord {
    if (!isElapsed(record, now)) return record
    return { ...record, status: 'expired', endTime: null, remainingSeconds: 0 }
}

function startRecord(record: TimerRecord, seconds: number, now: number): TimerRecord {
    const duration = clampSeconds(seconds)
    if (duration <= 0) return { ...IDLE_TIMER, muted: record.muted }
    return {
        status: 'running',
        endTime: now + duration * 1000,
        remainingSeconds: duration,
        durationSeconds: duration,
        lastDurationSeconds: duration,
        muted: record.muted,
    }
}

/** Applies a user action to the record. Pure: the caller persists the result. */
export function reduceTimer(record: TimerRecord, request: TimerRequest, now: number): TimerRecord {
    switch (request.action) {
        case 'start':
            return startRecord(record, request.seconds ?? 0, now)

        case 'pause': {
            if (record.status !== 'running') return record
            return { ...record, status: 'paused', endTime: null, remainingSeconds: remainingFrom(record, now) }
        }

        case 'resume': {
            const remaining = remainingFrom(record, now)
            if (record.status !== 'paused' || remaining <= 0) return record
            return { ...record, status: 'running', endTime: now + remaining * 1000 }
        }

        case 'togglePause':
            return record.status === 'running'
                ? reduceTimer(record, { action: 'pause' }, now)
                : reduceTimer(record, { action: 'resume' }, now)

        case 'reset':
            return { ...IDLE_TIMER, muted: record.muted }

        case 'restart':
            return record.lastDurationSeconds === null ? record : startRecord(record, record.lastDurationSeconds, now)

        case 'toggleMute':
            return { ...record, muted: !record.muted }
    }
}
