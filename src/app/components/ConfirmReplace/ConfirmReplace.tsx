import styles from './ConfirmReplace.module.css'

interface ConfirmReplaceProps {
    /** The duration that would replace the current timer, in minutes. */
    minutes: number
    onConfirm: () => void
    onCancel: () => void
}

/**
 * Replacing a timer that is still in progress needs consent (MANUAL "Timer
 * face"). Rendered inline instead of `window.confirm`, which closes a Chrome
 * popup before the user can answer.
 */
export function ConfirmReplace({ minutes, onConfirm, onCancel }: ConfirmReplaceProps) {
    return (
        <div className={styles.confirm} role="alert">
            <p className={styles.message}>A timer is already in progress. Replace it with {minutes} min?</p>
            <div className={styles.actions}>
                <button type="button" className={`${styles.action} ${styles.confirmAction}`} onClick={onConfirm}>
                    Replace
                </button>
                <button type="button" className={styles.action} onClick={onCancel} autoFocus>
                    Keep
                </button>
            </div>
        </div>
    )
}
