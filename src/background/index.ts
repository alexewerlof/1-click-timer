/**
 * 1-click timer — Manifest V3 service worker.
 *
 * The worker is the single writer of the timer record in `chrome.storage.local`:
 * it applies every UI action, schedules the alarms, paints the toolbar badge and
 * raises the "time is up" notification. It also owns the alarm sound, played by
 * an offscreen document because an MV3 worker has no audio output of its own —
 * that is what lets the alarm ring with no timer surface open (AGENTS.md
 * "Notification"). The worker is woken by the ring's end, so the alert icon and
 * the sound stay in step without anything polling.
 */

import { DEFAULT_SETTINGS, normalizeSettings, SETTINGS_STORAGE_KEY, type TimerSettings } from '../app/runtime/settings'
import { alertIconPathFor, iconPathFor } from '../shared/icons'
import {
    isRingEndedMessage,
    OFFSCREEN_DOCUMENT_PATH,
    OFFSCREEN_TARGET,
    type RingMessage,
    type StopMessage,
} from '../shared/offscreen'
import {
    expireIfElapsed,
    isTimerRequest,
    normalizeTimerRecord,
    reduceTimer,
    remainingFrom,
    TIMER_STORAGE_KEY,
    type TimerRecord,
    type TimerRequest,
    type TimerResponse,
} from '../shared/timer'
import { revealSurface, TIMER_PAGES } from '../shared/surfaces'
import { ringingNow, toolbarIconFor, type ToolbarIcon } from './alarm'
import { badgePlanFor } from './badge'

const LOG_PREFIX = '[1-click-timer:sw]'

const TICK_ALARM = '1ct-tick'
const TIMEUP_ALARM = '1ct-timeup'
const NOTIFICATION_ID = '1ct-timeup'

/** 30 s is the shortest repeating alarm Chrome allows; the badge is minute-accurate. */
const TICK_PERIOD_MINUTES = 0.5

const BASE_TITLE = '1-click timer'

const OFFSCREEN_URL = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)

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

/** The toolbar art shown while the alarm is sounding (AGENTS.md "Notification"). */
const ALERT_ICON: Record<number, string> = {
    19: chrome.runtime.getURL(alertIconPathFor(19)),
    38: chrome.runtime.getURL(alertIconPathFor(38)),
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

/**
 * The user's settings, read from `chrome.storage.sync` with the `local` fallback
 * the settings screen writes to (`chromeSettings.ts`). The worker only needs
 * these for the alarm: which chime, how loud, and how long it rings.
 */
async function readSettings(): Promise<TimerSettings> {
    try {
        const synced = await chrome.storage.sync.get(SETTINGS_STORAGE_KEY)
        if (synced[SETTINGS_STORAGE_KEY] !== undefined) {
            return normalizeSettings(synced[SETTINGS_STORAGE_KEY])
        }
    } catch (error) {
        console.warn(LOG_PREFIX, 'sync settings read failed:', (error as Error).message)
    }
    try {
        const local = await chrome.storage.local.get(SETTINGS_STORAGE_KEY)
        return normalizeSettings(local[SETTINGS_STORAGE_KEY])
    } catch {
        return DEFAULT_SETTINGS
    }
}

/** Whether the alarm should be audible for an expired record under `settings`. */
function alarmWanted(record: TimerRecord, settings: TimerSettings): boolean {
    return record.status === 'expired' && !record.muted && settings.chime !== 'silent' && settings.volume > 0
}

/** Clears `ringUntil` from any record that is not ringing (muted or not expired). */
function disarmRing(record: TimerRecord): TimerRecord {
    if (record.status === 'expired' && !record.muted) return record
    return record.ringUntil === null ? record : { ...record, ringUntil: null }
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

function setToolbarIcon(icon: ToolbarIcon): void {
    chrome.action.setIcon({ path: icon === 'alert' ? ALERT_ICON : TOOLBAR_ICON }).catch((error: Error) => {
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
 * Paints the toolbar badge — text and colour from `badge.ts`, the icon from
 * `alarm.ts` — and the title that goes with it.
 */
function describeBadge(record: TimerRecord, remaining: number): void {
    const badge = badgePlanFor(record, remaining)
    setBadge(badge.text)
    setBadgeColor(badge.color)
    setToolbarIcon(toolbarIconFor(record, Date.now()))

    switch (record.status) {
        case 'running':
            setTitle(formatMMSS(remaining))
            return

        case 'paused':
            setTitle(`Paused · ${formatMMSS(remaining)}`)
            return

        case 'expired':
            setTitle(ringingNow(record, Date.now()) ? 'Alarm ringing — open the timer to stop it' : 'Time is up')
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

function notifyElapsed(record: TimerRecord, ring: boolean): void {
    chrome.notifications
        .create(NOTIFICATION_ID, {
            type: 'basic' as chrome.notifications.TemplateType,
            iconUrl: chrome.runtime.getURL(NOTIFICATION_ICON),
            title: BASE_TITLE,
            message: `Time is up — ${describeDuration(record.durationSeconds)}.`,
            // With no surface open the notification is the only control, so it
            // stays put until the user acts: closing it stops the alarm and
            // resets the timer, and clicking it brings the timer to the front.
            priority: 2,
            requireInteraction: true,
            // Suppress the system sound only when our own chime is playing.
            silent: ring,
        })
        .catch((error: Error) => {
            console.warn(LOG_PREFIX, 'notification failed:', error.message)
        })
}

function clearNotification(): void {
    chrome.notifications.clear(NOTIFICATION_ID).catch((error: Error) => {
        console.warn(LOG_PREFIX, 'notification clear failed:', error.message)
    })
}

// ---- Offscreen audio ------------------------------------------------

let creatingOffscreen: Promise<void> | null = null

async function hasOffscreenDocument(): Promise<boolean> {
    const contexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [OFFSCREEN_URL],
    })
    return contexts.length > 0
}

/** Creates the alarm's offscreen document if it is not already open. */
async function ensureOffscreenDocument(): Promise<void> {
    if (await hasOffscreenDocument()) return
    if (creatingOffscreen === null) {
        creatingOffscreen = chrome.offscreen.createDocument({
            url: OFFSCREEN_DOCUMENT_PATH,
            reasons: ['AUDIO_PLAYBACK' as chrome.offscreen.Reason],
            justification: 'Play the alarm chime when the countdown ends, even with no timer surface open.',
        })
    }
    try {
        await creatingOffscreen
    } finally {
        creatingOffscreen = null
    }
}

/** Tells the offscreen document to ring out the record's remaining ring time. */
async function startRing(record: TimerRecord, settings: TimerSettings): Promise<void> {
    if (record.ringUntil === null) return
    const seconds = Math.max(1, Math.round((record.ringUntil - Date.now()) / 1000))
    try {
        await ensureOffscreenDocument()
        const message: RingMessage = {
            target: OFFSCREEN_TARGET,
            type: 'ring',
            chime: settings.chime,
            volume: settings.volume,
            seconds,
        }
        await chrome.runtime.sendMessage(message)
    } catch (error) {
        console.warn(LOG_PREFIX, 'could not start the alarm:', (error as Error).message)
    }
}

/** Silences the alarm if an offscreen document is open to silence. */
async function stopRing(): Promise<void> {
    try {
        if (!(await hasOffscreenDocument())) return
        const message: StopMessage = { target: OFFSCREEN_TARGET, type: 'stop' }
        await chrome.runtime.sendMessage(message)
    } catch (error) {
        console.warn(LOG_PREFIX, 'could not stop the alarm:', (error as Error).message)
    }
}

// ---- Surfaces -------------------------------------------------------

/**
 * Brings a timer surface to the front so the user can see what is ringing:
 * focus the fullscreen tab if one is open (or a popup opened as a tab), and only
 * open the fullscreen page when neither is (AGENTS.md "Full screen").
 */
async function bringSurfaceForward(): Promise<void> {
    try {
        await revealSurface(TIMER_PAGES)
    } catch (error) {
        console.warn(LOG_PREFIX, 'could not bring a timer surface forward:', (error as Error).message)
    }
}

// ---- Timeup ---------------------------------------------------------

/**
 * Guards against two triggers noticing the same expiry at once. The timeup
 * alarm and the periodic tick can both see the timer run out, and each handler
 * runs across `await`s, so without this the expiry would be handled twice — two
 * notifications and two tabs.
 */
let handlingTimeup = false

async function handleTimeup(): Promise<void> {
    if (handlingTimeup) return
    handlingTimeup = true
    try {
        const now = Date.now()
        const stored = await readRecord()
        // Only a running timer expires here: an already-expired record is left
        // alone, so waking the worker can never ring a second time.
        if (stored.status !== 'running') return

        const expired = expireIfElapsed(stored, now)
        if (expired.status !== 'expired') {
            // The alarm fired a moment early; keep the schedule ticking.
            await syncAlarms(expired)
            await updateBadge(expired)
            return
        }

        const settings = await readSettings()
        const ring = alarmWanted(expired, settings)
        const record: TimerRecord = { ...expired, ringUntil: ring ? now + settings.alarmSeconds * 1000 : null }
        console.log(LOG_PREFIX, `time up after ${record.durationSeconds}s`)
        await writeRecord(record)
        await syncAlarms(record)
        notifyElapsed(record, ring)
        if (ring) {
            await startRing(record, settings)
            await bringSurfaceForward()
        }
        await updateBadge(record)
    } finally {
        handlingTimeup = false
    }
}

async function handleTick(): Promise<void> {
    const record = await readRecord()
    if (record.status === 'running' && remainingFrom(record, Date.now()) <= 0) {
        await handleTimeup()
        return
    }
    await updateBadge(record)
}

/** The offscreen document finished its ring on its own: drop the alert. */
async function handleRingEnded(): Promise<void> {
    const record = await readRecord()
    if (record.ringUntil === null) return
    const next: TimerRecord = { ...record, ringUntil: null }
    await writeRecord(next)
    await updateBadge(next)
}

/**
 * The user dismissed the alarm (by closing its notification): stop the sound,
 * clear the notification and reset the timer to idle, so it never rings again
 * for a timer they have already acknowledged.
 */
async function dismissAlarm(): Promise<void> {
    const record = await readRecord()
    const next = disarmRing(reduceTimer(record, { action: 'reset' }, Date.now()))
    await writeRecord(next)
    await syncAlarms(next)
    await stopRing()
    clearNotification()
    await updateBadge(next)
}

async function applyAction(request: TimerRequest): Promise<void> {
    const now = Date.now()
    const current = expireIfElapsed(await readRecord(), now)
    const next = disarmRing(reduceTimer(current, request, now))
    await writeRecord(next)
    await syncAlarms(next)

    if (next.status === 'expired') {
        if (next.ringUntil === null) await stopRing()
    } else if (current.status === 'expired') {
        // The user acted on a ringing timer: silence it and clear the notice.
        await stopRing()
        clearNotification()
    }

    await updateBadge(next)
}

// ---- Messages -------------------------------------------------------

chrome.runtime.onMessage.addListener(
    (
        message: unknown,
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response: TimerResponse) => void,
    ): boolean => {
        // The offscreen document reporting it stopped ringing.
        if (isRingEndedMessage(message)) {
            void handleRingEnded()
            return false
        }
        // Anything else that is not a timer action (e.g. our own message to the
        // offscreen document) is not ours to answer.
        if (!isTimerRequest(message)) return false
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
    console.log(LOG_PREFIX, 'notification clicked → bring the timer forward')
    void bringSurfaceForward()
})

chrome.notifications.onClosed.addListener((notificationId, byUser) => {
    // `byUser` is false when the extension itself clears the notification, so
    // only a real dismissal resets the timer.
    if (notificationId !== NOTIFICATION_ID || !byUser) return
    console.log(LOG_PREFIX, 'notification dismissed → dismiss the alarm')
    void dismissAlarm()
})

// ---- Startup --------------------------------------------------------

async function startup(): Promise<void> {
    console.log(LOG_PREFIX, 'START')
    const now = Date.now()
    const stored = await readRecord()
    const resolved = expireIfElapsed(stored, now)

    if (stored.status === 'running' && resolved.status === 'expired') {
        console.log(LOG_PREFIX, 'timer ran out while the worker was asleep')
        await handleTimeup()
        return
    }

    const record = disarmRing(resolved)
    await writeRecord(record)
    await syncAlarms(record)

    if (ringingNow(record, now)) {
        // A ring was already underway when the worker went to sleep: ring out the
        // remainder, but do not raise a second notification for it.
        await startRing(record, await readSettings())
    } else if (record.status === 'expired') {
        await stopRing()
    }

    await updateBadge(record)
}

void startup()
