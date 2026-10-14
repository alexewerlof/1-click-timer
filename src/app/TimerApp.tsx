import { TimerFace } from './components/TimerFace/TimerFace'
import { TransportControls } from './components/TransportControls/TransportControls'
import { openSettings, toggleFullscreenSurface, type Surface } from './lib/surface'
import type { SettingsStore } from './runtime/settings'
import type { TimerRuntime } from './runtime/types'
import { useRemainingColor } from './runtime/useRemainingColor'
import { useTimerState } from './runtime/useTimerState'
import styles from './TimerApp.module.css'

export interface TimerAppProps {
    surface: Surface
    runtime: TimerRuntime
    settingsStore: SettingsStore
}

/**
 * The whole timer: one composition shared by the popup and the fullscreen tab
 * (AGENTS.md "UI vocabulary"). All timing lives behind `runtime`, so this component is
 * pure presentation; the settings only feed the remaining colour, so the dial
 * can follow the time left.
 */
export function TimerApp({ surface, runtime, settingsStore }: TimerAppProps) {
    const state = useTimerState(runtime)
    useRemainingColor(settingsStore, state)

    /**
     * Setting a timer is always one click, whether or not one is already
     * running: replacing a timer is low-risk and the worst case is starting
     * again (AGENTS.md "Set a custom timer").
     */
    function startTimer(seconds: number) {
        runtime.start(seconds)
    }

    return (
        <div className={styles.app} data-surface={surface}>
            {/*
             * The corner controls overlay the face rather than taking a row of
             * their own, so the dial gets the whole slot (AGENTS.md "Transport").
             */}
            <div className={styles.faceSlot}>
                <div className={styles.face}>
                    <TimerFace
                        status={state.status}
                        remainingSeconds={state.remainingSeconds}
                        onPick={startTimer}
                        onTogglePause={() => runtime.togglePause()}
                        onRestart={() => runtime.restart()}
                        onReset={() => runtime.reset()}
                    />
                </div>

                <TransportControls
                    status={state.status}
                    muted={state.muted}
                    surface={surface}
                    onToggleMute={() => runtime.toggleMute()}
                    onReset={() => runtime.reset()}
                    onToggleFullscreen={() => toggleFullscreenSurface(surface)}
                    onOpenSettings={() => openSettings()}
                />
            </div>
        </div>
    )
}
