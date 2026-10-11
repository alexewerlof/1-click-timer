import { useSyncExternalStore } from 'react'

/**
 * Whether the document is currently fullscreen, kept in sync with the
 * `fullscreenchange` event (the Fullscreen API is the truth, and only the
 * browser fires the change). The fullscreen control reads it so its glyph and
 * label can report which way pressing it will go (AGENTS.md "Full screen").
 */
export function useDocumentFullscreen(): boolean {
    return useSyncExternalStore(subscribe, isFullscreen, isFullscreen)
}

function subscribe(onChange: () => void): () => void {
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
}

function isFullscreen(): boolean {
    return document.fullscreenElement !== null
}
