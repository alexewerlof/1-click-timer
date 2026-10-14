/**
 * The protocol between the service worker and its offscreen document.
 *
 * The worker cannot play audio — an MV3 service worker has no `AudioContext` —
 * so the alarm is played by an offscreen document, the one context Chrome gives
 * an extension for exactly this (AGENTS.md "Notification"). Every message is
 * broadcast across all extension contexts, so each carries a `target` and the
 * receiver ignores anything not addressed to it (`chrome.runtime.sendMessage`
 * does not deliver a message back to its own sender).
 */

import type { ChimeId } from '../app/lib/chimes'

/** The offscreen document's path inside the extension. */
export const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html'

/** Addresses the offscreen document. */
export const OFFSCREEN_TARGET = 'offscreen'

/** Addresses the service worker. */
export const WORKER_TARGET = 'worker'

/** Start ringing `chime` at `volume`, stopping on its own after `seconds`. */
export interface RingMessage {
    target: typeof OFFSCREEN_TARGET
    type: 'ring'
    chime: ChimeId
    volume: number
    seconds: number
}

/** Stop ringing now (dismissed, reset, restarted or muted). */
export interface StopMessage {
    target: typeof OFFSCREEN_TARGET
    type: 'stop'
}

export type OffscreenMessage = RingMessage | StopMessage

/** The offscreen document reporting that it finished ringing on its own. */
export interface RingEndedMessage {
    target: typeof WORKER_TARGET
    type: 'ring-ended'
}

function hasTarget(value: unknown, target: string): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && (value as Record<string, unknown>).target === target
}

export function isOffscreenMessage(value: unknown): value is OffscreenMessage {
    if (!hasTarget(value, OFFSCREEN_TARGET)) return false
    const type = value.type
    return type === 'ring' || type === 'stop'
}

export function isRingEndedMessage(value: unknown): value is RingEndedMessage {
    return hasTarget(value, WORKER_TARGET) && value.type === 'ring-ended'
}
