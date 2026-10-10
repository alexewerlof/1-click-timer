import { useState } from 'react'
import { ConfirmReplace } from './components/ConfirmReplace/ConfirmReplace'
import { DevBar } from './components/DevBar/DevBar'
import { PresetBar } from './components/PresetBar/PresetBar'
import { TimerFace } from './components/TimerFace/TimerFace'
import { TransportControls } from './components/TransportControls/TransportControls'
import { SECONDS_PER_MINUTE } from './lib/time'
import { toggleFullscreenSurface, type Surface } from './lib/surface'
import type { TimerDevControls, TimerRuntime } from './runtime/types'
import { useTimerState } from './runtime/useTimerState'
import styles from './TimerApp.module.css'

export interface TimerAppProps {
    surface: Surface
    runtime: TimerRuntime
    /** Design harness; only ever passed in development. */
    dev?: TimerDevControls
}

/**
 * The whole timer: one composition shared by the popup and the fullscreen tab
 * (MANUAL "Interface"). All timing lives behind `runtime`, so this component
 * is pure presentation plus the "replace a running timer?" conversation.
 */
export function TimerApp({ surface, runtime, dev }: TimerAppProps) {
    const state = useTimerState(runtime)
    const [pendingSeconds, setPendingSeconds] = useState<number | null>(null)

    const inProgress = state.status === 'running' || state.status === 'paused'

    function requestStart(seconds: number) {
        if (inProgress) {
            setPendingSeconds(seconds)
            return
        }
        runtime.start(seconds)
    }

    function confirmReplace() {
        if (pendingSeconds !== null) runtime.start(pendingSeconds)
        setPendingSeconds(null)
    }

    return (
        <div className={styles.app} data-surface={surface}>
            <div className={styles.faceSlot}>
                <div className={styles.face}>
                    <TimerFace status={state.status} remainingSeconds={state.remainingSeconds} onPick={requestStart} />
                </div>
            </div>

            <div className={styles.controls}>
                <PresetBar presets={state.presets} activeSeconds={state.durationSeconds} onPick={requestStart} />
                {pendingSeconds === null ? (
                    <TransportControls
                        status={state.status}
                        muted={state.muted}
                        canRestart={state.lastDurationSeconds !== null && !inProgress}
                        surface={surface}
                        onTogglePause={() => runtime.togglePause()}
                        onToggleMute={() => runtime.toggleMute()}
                        onReset={() => runtime.reset()}
                        onRestart={() => runtime.restart()}
                        onToggleFullscreen={() => toggleFullscreenSurface(surface)}
                    />
                ) : (
                    <ConfirmReplace
                        minutes={Math.round(pendingSeconds / SECONDS_PER_MINUTE)}
                        onConfirm={confirmReplace}
                        onCancel={() => setPendingSeconds(null)}
                    />
                )}
            </div>

            {dev ? <DevBar status={state.status} onStatusChange={dev.forceStatus} /> : null}
        </div>
    )
}
