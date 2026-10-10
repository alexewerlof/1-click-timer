/**
 * 1-click timer — Manifest V3 Service Worker (TypeScript).
 */

// ---- Types ----------------------------------------------------------

interface TimerState {
    running: boolean
    endTime: number | null
    alarming: boolean
}

interface PopupMessage {
    action: string
    seconds?: number
}

interface PopupResponse {
    success?: boolean
    error?: string
    running?: boolean
    endTime?: number | null
    alarming?: boolean
    remaining?: number
}

// ---- Helpers --------------------------------------------------------

const LOG_PREFIX = '[1-click-timer:sw]'

function setBadge(text: string): void {
    chrome.action.setBadgeText({ text: text }).catch((err: Error) => {
        console.warn(LOG_PREFIX, 'setBadgeText failed:', err.message)
    })
}

function setColor(r: number, g: number, b: number): void {
    chrome.action.setBadgeBackgroundColor({ color: [r, g, b, 255] }).catch((err: Error) => {
        console.warn(LOG_PREFIX, 'setBadgeBackgroundColor failed:', err.message)
    })
}

function setTitle(title: string): void {
    chrome.action.setTitle({ title: title }).catch((err: Error) => {
        console.warn(LOG_PREFIX, 'setTitle failed:', err.message)
    })
}

function setIcon(name: string): void {
    chrome.action.setIcon({ path: 'images/' + name + '.png' }).catch((err: Error) => {
        console.warn(LOG_PREFIX, `setIcon failed for "${name}":`, err.message)
    })
}

// ---- State ----------------------------------------------------------

const STATE_KEY = 'timerState'

function getRemaining(endTime: number | null): number {
    if (!endTime) return 0
    return Math.max(0, Math.round((endTime - Date.now()) / 1000))
}

function formatMMSS(remaining: number): string {
    const m = Math.floor(remaining / 60)
    const s = remaining % 60
    return m + ':' + (s < 10 ? '0' + s : String(s))
}

async function getState(): Promise<TimerState> {
    const stored = (await chrome.storage.local.get(STATE_KEY)) as Record<string, TimerState | undefined>
    return stored[STATE_KEY] ?? { running: false, endTime: null, alarming: false }
}

async function saveState(state: TimerState): Promise<void> {
    const obj: Record<string, TimerState> = {}
    obj[STATE_KEY] = state
    await chrome.storage.local.set(obj)
}

// ---- Badge update ---------------------------------------------------

async function updateBadge(): Promise<void> {
    const state = await getState()

    if (!state.running || !state.endTime) {
        if (!state.alarming) {
            setBadge('')
            setIcon('logo19')
            setTitle('1-click timer')
        }
        return
    }

    const remaining = getRemaining(state.endTime)

    if (remaining <= 0) {
        console.log(LOG_PREFIX, `badge: time expired (remaining=${remaining})`)
        await handleTimeup()
        return
    }

    const mmss = formatMMSS(remaining)

    if (remaining > 60) {
        const minutes = Math.floor(remaining / 60)
        setBadge(minutes + 'm')
        setColor(Math.floor(((60 - minutes) * 255) / 60), 128, 0)
        setIcon('logo19')
    } else {
        const seconds = remaining % 60
        if (seconds > 0) {
            setBadge(String(seconds))
            setColor(255, 0, 0)
            setIcon(seconds % 2 ? 'logo19_inverse' : 'logo19')
        } else {
            setBadge('')
            setIcon('logo19')
        }
    }
    setTitle(mmss)

    console.log(
        LOG_PREFIX,
        `badge → "${remaining > 60 ? Math.floor(remaining / 60) + 'm' : String(remaining % 60)}" | ${mmss} remaining`,
    )
}

// ---- Timeup ----------------------------------------------------------

let _bellInterval: ReturnType<typeof setInterval> | null = null

async function handleTimeup(): Promise<void> {
    console.log(LOG_PREFIX, 'timeup!')

    const state = await getState()
    state.running = false
    state.alarming = true
    await saveState(state)

    if (_bellInterval) clearInterval(_bellInterval)
    let bellInverse = false
    setIcon('logo19_bell')
    _bellInterval = setInterval(() => {
        bellInverse = !bellInverse
        setIcon(bellInverse ? 'logo19_bell_inverse' : 'logo19_bell')
    }, 500)

    chrome.notifications
        .create({
            type: 'basic' as chrome.notifications.TemplateType,
            iconUrl: chrome.runtime.getURL('images/logo128.png'),
            title: '1-click timer',
            message: 'Time is up!',
            priority: 2,
        })
        .catch((err: Error) => {
            console.warn(LOG_PREFIX, 'notification failed:', err.message)
        })

    console.log(LOG_PREFIX, 'notification shown')
}

function stopBellAnimation(): void {
    if (_bellInterval) {
        clearInterval(_bellInterval)
        _bellInterval = null
    }
    setBadge('')
    setIcon('logo19')
    setTitle('1-click timer')
}

// ---- Alarms ----------------------------------------------------------

const TICK_ALARM = '1ct-tick'
const TIMEUP_ALARM = '1ct-timeup'

async function createAlarms(endTime: number): Promise<void> {
    await chrome.alarms.clear(TICK_ALARM)
    await chrome.alarms.clear(TIMEUP_ALARM)

    await chrome.alarms.create(TICK_ALARM, { periodInMinutes: 0.5 })
    await chrome.alarms.create(TIMEUP_ALARM, { when: endTime })

    console.log(LOG_PREFIX, `alarms created: tick(30s), timeup at ${new Date(endTime).toISOString()}`)
}

async function clearAllAlarms(): Promise<void> {
    await chrome.alarms.clear(TICK_ALARM)
    await chrome.alarms.clear(TIMEUP_ALARM)
    console.log(LOG_PREFIX, 'alarms cleared')
}

// ---- Message handlers ------------------------------------------------

chrome.runtime.onMessage.addListener(
    (
        message: PopupMessage,
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response: PopupResponse) => void,
    ): boolean => {
        console.log(LOG_PREFIX, 'msg received:', JSON.stringify(message))

        ;(async () => {
            try {
                switch (message.action) {
                    case 'start': {
                        const seconds = Math.min(Math.max(0, message.seconds || 0), 3600)
                        if (seconds === 0) {
                            sendResponse({ success: false, error: 'seconds must be > 0' })
                            return
                        }
                        const endTime = Date.now() + seconds * 1000
                        await saveState({ running: true, endTime, alarming: false })
                        await createAlarms(endTime)
                        await updateBadge()
                        console.log(LOG_PREFIX, `started: ${seconds}s → endTime=${new Date(endTime).toISOString()}`)
                        sendResponse({ success: true })
                        return
                    }

                    case 'stop':
                        await saveState({
                            running: false,
                            endTime: null,
                            alarming: false,
                        })
                        await clearAllAlarms()
                        setBadge('')
                        setIcon('logo19')
                        setTitle('1-click timer')
                        console.log(LOG_PREFIX, 'stopped')
                        sendResponse({ success: true })
                        return

                    case 'reset':
                        await saveState({
                            running: false,
                            endTime: null,
                            alarming: false,
                        })
                        await clearAllAlarms()
                        stopBellAnimation()
                        console.log(LOG_PREFIX, 'reset')
                        sendResponse({ success: true })
                        return

                    case 'silent':
                        await clearAllAlarms()
                        stopBellAnimation()
                        await saveState({
                            running: false,
                            endTime: null,
                            alarming: false,
                        })
                        console.log(LOG_PREFIX, 'silent')
                        sendResponse({ success: true })
                        return

                    case 'getState': {
                        const state = await getState()
                        const remaining = getRemaining(state.endTime)
                        console.log(
                            LOG_PREFIX,
                            `state: running=${state.running} alarming=${state.alarming} remaining=${remaining}s`,
                        )
                        sendResponse({
                            running: state.running,
                            endTime: state.endTime,
                            alarming: state.alarming,
                            remaining,
                        })
                        return
                    }

                    default:
                        console.warn(LOG_PREFIX, 'unknown action:', message.action)
                        sendResponse({ error: 'Unknown action: ' + message.action })
                }
            } catch (err) {
                const error = err as Error
                console.error(LOG_PREFIX, 'ERROR:', error.message, error.stack)
                sendResponse({ error: error.message })
            }
        })()

        return true // keep channel open for async response
    },
)

// ---- Alarm handler ---------------------------------------------------

chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
    console.log(LOG_PREFIX, 'alarm fired:', alarm.name)

    if (alarm.name === TICK_ALARM) {
        await updateBadge()
    } else if (alarm.name === TIMEUP_ALARM) {
        await handleTimeup()
    }
})

// ---- Notification click → silence ------------------------------------

chrome.notifications.onClicked.addListener(async () => {
    console.log(LOG_PREFIX, 'notification clicked → silent')
    stopBellAnimation()
    await saveState({ running: false, endTime: null, alarming: false })
})

// ---- Startup ----------------------------------------------------------

;(async function startup(): Promise<void> {
    console.log(LOG_PREFIX, 'START')

    const state = await getState()
    console.log(LOG_PREFIX, 'stored state:', JSON.stringify(state))

    if (state.alarming) {
        console.log(LOG_PREFIX, 'restoring alarming state')
        if (_bellInterval) clearInterval(_bellInterval)
        let bellInverse = false
        setIcon('logo19_bell')
        _bellInterval = setInterval(() => {
            bellInverse = !bellInverse
            setIcon(bellInverse ? 'logo19_bell_inverse' : 'logo19_bell')
        }, 500)
        return
    }

    if (state.running && state.endTime) {
        const remaining = getRemaining(state.endTime)
        console.log(LOG_PREFIX, `restoring: ${remaining}s remaining`)

        if (remaining <= 0) {
            console.log(LOG_PREFIX, 'timer expired while SW was inactive')
            await handleTimeup()
        } else {
            const existing = await chrome.alarms.get(TIMEUP_ALARM)
            if (!existing) {
                console.log(LOG_PREFIX, 're-creating alarms')
                await createAlarms(state.endTime)
            } else {
                console.log(LOG_PREFIX, 'alarms still present')
            }
            await updateBadge()
        }
    } else {
        setBadge('')
        setIcon('logo19')
        setTitle('1-click timer')
    }
})()
