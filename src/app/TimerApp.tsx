import { DevBar } from './components/DevBar/DevBar'
import { TimerFace } from './components/TimerFace/TimerFace'
import { TransportControls } from './components/TransportControls/TransportControls'
import { AUTHOR_SITE_URL, openTab } from './lib/links'
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
            {/*
             * The corner controls overlay the face rather than taking a row of
             * their own, so the dial gets the whole slot (MANUAL "Transport").
             */}
            <div className={styles.faceSlot}>
                <div className={styles.face}>
                    <TimerFace
                        status={state.status}
                        remainingSeconds={state.remainingSeconds}
                        onPick={startTimer}
                        onTogglePause={() => runtime.togglePause()}
                        onRestart={() => runtime.restart()}
                    />
                </div>

                <TransportControls
                    status={state.status}
                    muted={state.muted}
                    surface={surface}
                    onToggleMute={() => runtime.toggleMute()}
                    onReset={() => runtime.reset()}
                    onToggleFullscreen={() => toggleFullscreenSurface(surface)}
                    onOpenAbout={() => openTab(AUTHOR_SITE_URL)}
                />
            </div>

            {dev ? <DevBar status={state.status} onStatusChange={dev.forceStatus} /> : null}
        </div>
    )
}
