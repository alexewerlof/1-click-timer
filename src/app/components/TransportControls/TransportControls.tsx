import type { ReactNode } from 'react'
import { Expand, FolderPlus, Pause, Play, Settings, Shrink, Square, Volume2, VolumeOff } from 'lucide-react'
import type { Surface } from '../../lib/surface'
import { useDocumentFullscreen } from '../../lib/useDocumentFullscreen'
import type { TimerStatus } from '../../runtime/types'
import styles from './TransportControls.module.css'

/** One corner of the dial's square, where a control is pinned. */
type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface TransportControlsProps {
    status: TimerStatus
    muted: boolean
    surface: Surface
    onToggleMute: () => void
    /** Stop or resume the running timer (AGENTS.md "Stop a timer"). */
    onTogglePause: () => void
    onReset: () => void
    onToggleFullscreen: () => void
    /** Opens the settings screen (AGENTS.md "Settings"). */
    onOpenSettings: () => void
}

interface CornerButtonProps {
    corner: Corner
    /** Names the control for the pointer and the accessibility tree. */
    label: string
    onClick?: () => void
    /** Toggles only: whether the control is currently on. */
    pressed?: boolean
    disabled?: boolean
    children: ReactNode
}

interface FullscreenAction {
    label: string
    Icon: typeof Expand
}

/**
 * What the fullscreen control offers right now. In the popup it opens the timer
 * in a tab; in the tab it toggles fullscreen, and it shows the way it will go —
 * expand on the way in, shrink on the way back (AGENTS.md "Full screen").
 */
function fullscreenAction(surface: Surface, nativeFullscreen: boolean): FullscreenAction {
    if (surface === 'popup') return { label: 'Open in a tab', Icon: FolderPlus }
    if (nativeFullscreen) return { label: 'Exit full screen', Icon: Shrink }
    return { label: 'Full screen', Icon: Expand }
}

interface PauseAction {
    label: string
    Icon: typeof Pause
    run: () => void
    disabled?: boolean
}

/**
 * What the bottom-left control offers in a given state. It has one job — pause a
 * running timer, resume a paused one — and, while the alarm is ringing, stops the
 * timer: resetting it also silences the ring, so a Stop glyph is what a ringing
 * timer is asking for (AGENTS.md "Stop a timer", "Restart the timer"). An idle
 * timer has nothing to act on, so the control is disabled.
 */
function pauseAction(status: TimerStatus, onTogglePause: () => void, onReset: () => void): PauseAction {
    switch (status) {
        case 'running':
            return { label: 'Pause', Icon: Pause, run: onTogglePause }
        case 'paused':
            return { label: 'Resume', Icon: Play, run: onTogglePause }
        case 'expired':
            return { label: 'Stop', Icon: Square, run: onReset }
        default:
            return { label: 'Play', Icon: Play, run: onTogglePause, disabled: true }
    }
}

/** A single soft-plastic control, pinned to one corner of the dial's square. */
function CornerButton({ corner, label, onClick, pressed, disabled, children }: CornerButtonProps) {
    return (
        <button
            type="button"
            className={styles.button}
            data-corner={corner}
            onClick={onClick}
            aria-pressed={pressed}
            aria-label={label}
            title={label}
            disabled={disabled}
        >
            {children}
        </button>
    )
}

/**
 * The four corner controls (AGENTS.md "Transport"), one per corner of the dial's
 * square: mute (top left), fullscreen (top right), play/pause (bottom left) and
 * settings (bottom right).
 *
 * They are soft-plastic discs — the surface colour, lit from the top left and
 * shaded to the bottom right, with the glyph black by default and red on hover
 * — so the dial stays the loudest thing on the screen. The bottom-left control
 * pauses a running timer and resumes a paused one, and stops the alarm while it
 * rings (resetting the timer silences it — AGENTS.md "Stop a timer"). Restart
 * lives on the readout disc (`ReadoutControl`).
 */
export function TransportControls({
    status,
    muted,
    surface,
    onToggleMute,
    onTogglePause,
    onReset,
    onToggleFullscreen,
    onOpenSettings,
}: TransportControlsProps) {
    const nativeFullscreen = useDocumentFullscreen()
    const { label: fullscreenLabel, Icon: FullscreenIcon } = fullscreenAction(surface, nativeFullscreen)
    const {
        label: pauseLabel,
        Icon: PauseIcon,
        run: runPause,
        disabled: pauseDisabled,
    } = pauseAction(status, onTogglePause, onReset)

    return (
        <div className={styles.corners} role="group" aria-label="Timer controls">
            <CornerButton corner="top-left" label={muted ? 'Unmute' : 'Mute'} onClick={onToggleMute} pressed={muted}>
                {muted ? <VolumeOff /> : <Volume2 />}
            </CornerButton>

            <CornerButton corner="top-right" label={fullscreenLabel} onClick={onToggleFullscreen}>
                <FullscreenIcon />
            </CornerButton>

            <CornerButton corner="bottom-left" label={pauseLabel} onClick={runPause} disabled={pauseDisabled}>
                <PauseIcon />
            </CornerButton>

            {/* Settings (AGENTS.md "Settings"). */}
            <CornerButton corner="bottom-right" label="Settings" onClick={onOpenSettings}>
                <Settings />
            </CornerButton>
        </div>
    )
}
