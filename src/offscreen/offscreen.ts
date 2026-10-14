/**
 * The offscreen document: the extension's only source of alarm audio.
 *
 * An MV3 service worker has no DOM and no `AudioContext`, so it cannot play the
 * chime itself. This hidden page is created for that alone — its reason is
 * `AUDIO_PLAYBACK` — and it plays the same synthesised chime the settings screen
 * previews (`app/lib/chimes.ts`). It stops on its own after the requested number
 * of seconds and tells the worker, so the worker can drop the alert icon without
 * anything having to wake on a schedule.
 */

import { startChime } from '../app/lib/chimes'
import { isOffscreenMessage, WORKER_TARGET, type RingEndedMessage } from '../shared/offscreen'

let stopRing: (() => void) | null = null
let ringTimeout: number | null = null

function silence(): void {
    stopRing?.()
    stopRing = null
    if (ringTimeout !== null) {
        window.clearTimeout(ringTimeout)
        ringTimeout = null
    }
}

function reportEnded(): void {
    const message: RingEndedMessage = { target: WORKER_TARGET, type: 'ring-ended' }
    void chrome.runtime.sendMessage(message).catch(() => {
        // The worker is gone; nothing left to update.
    })
}

chrome.runtime.onMessage.addListener((message: unknown) => {
    if (!isOffscreenMessage(message)) return

    if (message.type === 'stop') {
        silence()
        return
    }

    silence()
    stopRing = startChime(message.chime, message.volume)
    ringTimeout = window.setTimeout(() => {
        ringTimeout = null
        silence()
        reportEnded()
    }, message.seconds * 1000)
})
