/**
 * 1-click timer — Manifest V3 service worker.
 *
 * The worker is the single writer of the timer record in `chrome.storage.local`:
 * it applies every UI action, schedules the alarms, paints the toolbar badge and
 * raises the "time is up" notification. The alarm sound itself is played by the
 * UI (see `app/lib/chimes.ts`), because the worker has no audio output — this is
 * the split the README describes.
 */

import { iconPathFor } from '../shared/icons'
import {
    expireIfElapsed,
    normalizeTimerRecord,
    reduceTimer,
    remainingFrom,
    TIMER_STORAGE_KEY,
    type TimerRecord,
    type TimerRequest,
    type TimerResponse,
} from '../shared/timer'
import { badgePlanFor } from './badge'

const LOG_PREFIX = '[1-click-timer:sw]'

const TICK_ALARM = '1ct-tick'
const TIMEUP_ALARM = '1ct-timeup'
const NOTIFICATION_ID = '1ct-timeup'

/** 30 s is the shortest repeating alarm Chrome allows; the badge is minute-accurate. */
const TICK_PERIOD_MINUTES = 0.5

const BASE_TITLE = '1-click timer'

/**
 * The toolbar icon, in both the 1x and the 2x size, so Chrome picks the file
 * that matches the display instead of scaling the small one.
 *
 * The paths are absolute: `setIcon` rejects a path relative to the install
 * directory with "Failed to fetch" when the extension is loaded unpacked, even
 * though the same file fetches fine from the worker.
 */
const TOOLBAR_ICON: Record<number, string> = {
    19: chrome.runtime.getURL(iconPathFor(19)),
    38: chrome.runtime.getURL(iconPathFor(38)),
}

/** The icon the "time is up" notification carries. */
const NOTIFICATION_ICON = iconPathFor(128)

// ---- Storage --------------------------------------------------------

async function readRecord(): Promise<TimerRecord> {
    const stored = await chrome.storage.local.get(TIMER_STORAGE_KEY)
    return normalizeTimerRecord(stored[TIMER_STORAGE_KEY])
}

async function writeRecord(record: TimerRecord): Promise<void> {
    await chrome.storage.local.set({ [TIMER_STORAGE_KEY]: record })
}

// ---- Toolbar --------------------------------------------------------

function setBadge(text: string): void {
    chrome.action.setBadgeText({ text }).catch((error: Error) => {
        console.warn(LOG_PREFIX, 'setBadgeText failed:', error.message)
    })
}

function setBadgeColor(color: string): void {
    chrome.action.setBadgeBackgroundColor({ color }).catch((error: Error) => {
        console.warn(LOG_PREFIX, 'setBadgeBackgroundColor failed:', error.message)
    })
}

function setTitle(title: string): void {
    chrome.action.setTitle({ title }).catch((error: Error) => {
        console.warn(LOG_PREFIX, 'setTitle failed:', error.message)
    })
}

function setToolbarIcon(): void {
    chrome.action.setIcon({ path: TOOLBAR_ICON }).catch((error: Error) => {
        console.warn(LOG_PREFIX, 'setIcon failed:', error.message)
    })
}

function formatMMSS(seconds: number): string {
    const total = Math.max(0, Math.round(seconds))
    const minutes = Math.floor(total / 60)
    const rest = total % 60
    return `${minutes}:${String(rest).padStart(2, '0')}`
}

/** The elapsed period, phrased for the notification (AGENTS.md "Notification"). */
function describeDuration(seconds: number): string {
    const total = Math.max(0, Math.round(seconds))
    if (total < 60) return `${total} seconds`
    const minutes = Math.floor(total / 60)
    const rest = total % 60
    const minuteLabel = `${minutes} minute${minutes === 1 ? '' : 's'}`
    return rest === 0 ? minuteLabel : `${minuteLabel} ${rest} seconds`
}

/**
 * Paints the toolbar badge — text and colour from `badge.ts` — and the icon and
 * title that go with it.
 */
function describeBadge(record: TimerRecord, remaining: number): void {
    const badge = badgePlanFor(record, remaining)
    setBadge(badge.text)
    setBadgeColor(badge.color)
    setToolbarIcon()

    switch (record.status) {
        case 'running':
            setTitle(formatMMSS(remaining))
            return

        case 'paused':
            setTitle(`Paused · ${formatMMSS(remaining)}`)
            return

        case 'expired':
            // The badge is already cleared; the cue is the notification, plus the
            // chime the UI plays while a timer surface is open.
            setTitle('Time is up')
            return

        default:
            setTitle(BASE_TITLE)
    }
}

async function updateBadge(record: TimerRecord): Promise<void> {
    const now = Date.now()
    const resolved = expireIfElapsed(record, now)
    describeBadge(resolved, remainingFrom(resolved, now))
}

// ---- Alarms ---------------------------------------------------------

async function syncAlarms(record: TimerRecord): Promise<void> {
    await chrome.alarms.clear(TICK_ALARM)
    await chrome.alarms.clear(TIMEUP_ALARM)
    if (record.status === 'running' && record.endTime !== null) {
        await chrome.alarms.create(TIMEUP_ALARM, { when: record.endTime })
        await chrome.alarms.create(TICK_ALARM, { periodInMinutes: TICK_PERIOD_MINUTES })
    }
}

// ---- Notification ---------------------------------------------------

function notifyElapsed(record: TimerRecord): void {
    chrome.notifications
        .create(NOTIFICATION_ID, {
            type: 'basic' as chrome.notifications.TemplateType,
            iconUrl: chrome.runtime.getURL(NOTIFICATION_ICON),
            title: BASE_TITLE,
            message: `Time is up — ${describeDuration(record.durationSeconds)}.`,
            priority: 2,
        })
        .catch((error: Error) => {
            console.warn(LOG_PREFIX, 'notification failed:', error.message)
        })
}

// ---- Timeup ---------------------------------------------------------

async function handleTimeup(): Promise<void> {
    const record = expireIfElapsed(await readRecord(), Date.now())
    console.log(LOG_PREFIX, `time up after ${record.durationSeconds}s`)
    await writeRecord(record)
    await syncAlarms(record)
    notifyElapsed(record)
    await updateBadge(record)
}

async function handleTick(): Promise<void> {
    const record = await readRecord()
    if (record.status === 'running' && remainingFrom(record, Date.now()) <= 0) {
        await handleTimeup()
        return
    }
    await updateBadge(record)
}

async function applyAction(request: TimerRequest): Promise<void> {
    const now = Date.now()
    const current = expireIfElapsed(await readRecord(), now)
    const next = reduceTimer(current, request, now)
    await writeRecord(next)
    await syncAlarms(next)
    await updateBadge(next)
}

// ---- Messages -------------------------------------------------------

chrome.runtime.onMessage.addListener(
    (
        message: TimerRequest,
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response: TimerResponse) => void,
    ): boolean => {
        void (async () => {
            try {
                await applyAction(message)
                sendResponse({ ok: true })
            } catch (error) {
                const failure = error as Error
                console.error(LOG_PREFIX, 'ERROR:', failure.message, failure.stack)
                sendResponse({ ok: false, error: failure.message })
            }
        })()
        return true // keep the channel open for the async response
    },
)

chrome.alarms.onAlarm.addListener((alarm) => {
    console.log(LOG_PREFIX, 'alarm fired:', alarm.name)
    if (alarm.name === TIMEUP_ALARM) {
        void handleTimeup()
    } else if (alarm.name === TICK_ALARM) {
        void handleTick()
    }
})

chrome.notifications.onClicked.addListener(() => {
    console.log(LOG_PREFIX, 'notification clicked → restore the quiet toolbar')
    setBadge('')
    setToolbarIcon()
    setTitle(BASE_TITLE)
})

// ---- Startup --------------------------------------------------------

async function startup(): Promise<void> {
    console.log(LOG_PREFIX, 'START')
    const stored = await readRecord()
    const record = expireIfElapsed(stored, Date.now())
    const justElapsed = stored.status === 'running' && record.status === 'expired'
    await writeRecord(record)
    await syncAlarms(record)

    if (justElapsed) {
        console.log(LOG_PREFIX, 'timer ran out while the worker was asleep')
        notifyElapsed(record)
        await updateBadge(record)
        return
    }

    if (record.status === 'expired') {
        // Already rang earlier; restore the quiet toolbar rather than alarming again.
        setBadge('')
        setToolbarIcon()
        setTitle(BASE_TITLE)
        return
    }

    await updateBadge(record)
}

void startup()
