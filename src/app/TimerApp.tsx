import { DevBar } from './components/DevBar/DevBar'
import { TimerFace } from './components/TimerFace/TimerFace'
import { TransportControls } from './components/TransportControls/TransportControls'
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
 * (MANUAL "Interface"). All timing lives behind `runtime`, so this component is
 * pure presentation.
 */
export function TimerApp({ surface, runtime, dev }: TimerAppProps) {
    const state = useTimerState(runtime)

    const inProgress = state.status === 'running' || state.status === 'paused'

    /**
     * Setting a timer is always one click, whether or not one is already
     * running: replacing a timer is low-risk and the worst case is starting
     * again (MANUAL "Set a custom timer").
     */
    function startTimer(seconds: number) {
        runtime.start(seconds)
    }

    return (
        <div className={styles.app} data-surface={surface}>
            <div className={styles.faceSlot}>
                <div className={styles.face}>
                    <TimerFace status={state.status} remainingSeconds={state.remainingSeconds} onPick={startTimer} />
                </div>
            </div>

            <div className={styles.controls}>
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
            </div>

            {dev ? <DevBar status={state.status} onStatusChange={dev.forceStatus} /> : null}
        </div>
    )
}
