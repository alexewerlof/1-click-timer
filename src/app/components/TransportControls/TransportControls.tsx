import type { ReactNode } from 'react'
import { Coffee, Expand, Maximize, Shrink, TimerOff, Volume2, VolumeOff } from 'lucide-react'
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
    onReset: () => void
    onToggleFullscreen: () => void
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
 * expand on the way in, shrink on the way back (MANUAL "Full screen").
 */
function fullscreenAction(surface: Surface, nativeFullscreen: boolean): FullscreenAction {
    if (surface === 'popup') return { label: 'Open in a tab', Icon: Maximize }
    if (nativeFullscreen) return { label: 'Exit full screen', Icon: Shrink }
    return { label: 'Full screen', Icon: Expand }
}

/** A single ghost control, pinned to one corner of the dial's square. */
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
 * The four corner controls (MANUAL "Transport"), one per corner of the dial's
 * square: mute (top left), fullscreen (top right), reset (bottom left) and the
 * break button (bottom right).
 *
 * They are ghost glyphs — black by default, red on hover — so the dial stays the
 * loudest thing on the screen. Pause/resume and restart are not here: they live
 * on the readout disc (`ReadoutControl`).
 */
export function TransportControls({
    status,
    muted,
    surface,
    onToggleMute,
    onReset,
    onToggleFullscreen,
}: TransportControlsProps) {
    const nativeFullscreen = useDocumentFullscreen()
    const { label: fullscreenLabel, Icon: FullscreenIcon } = fullscreenAction(surface, nativeFullscreen)

    return (
        <div className={styles.corners} role="group" aria-label="Timer controls">
            <CornerButton corner="top-left" label={muted ? 'Unmute' : 'Mute'} onClick={onToggleMute} pressed={muted}>
                {muted ? <VolumeOff /> : <Volume2 />}
            </CornerButton>

            <CornerButton corner="top-right" label={fullscreenLabel} onClick={onToggleFullscreen}>
                <FullscreenIcon />
            </CornerButton>

            <CornerButton corner="bottom-left" label="Reset" onClick={onReset} disabled={status === 'idle'}>
                <TimerOff />
            </CornerButton>

            {/* The break button's behaviour is still to come; only its glyph is placed for now. */}
            <CornerButton corner="bottom-right" label="Coffee break">
                <Coffee />
            </CornerButton>
        </div>
    )
}
