import type { TimerStatus } from '../../runtime/types'
import styles from './DevBar.module.css'

const STATUSES: readonly TimerStatus[] = ['idle', 'running', 'paused', 'expired']

interface DevBarProps {
    status: TimerStatus
    onStatusChange: (status: TimerStatus) => void
}

/**
 * Design harness: park the timer in a given state so every visual can be
 * compared. Rendered only when `import.meta.env.DEV`, so it never ships.
 */
export function DevBar({ status, onStatusChange }: DevBarProps) {
    return (
        <div className={styles.bar}>
            <span className={styles.caption}>State</span>
            {STATUSES.map((id) => (
                <button
                    key={id}
                    type="button"
                    className={styles.option}
                    data-active={id === status}
                    aria-pressed={id === status}
                    onClick={() => onStatusChange(id)}
                >
                    {id}
                </button>
            ))}
        </div>
    )
}
