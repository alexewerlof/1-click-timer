/**
 * The colour choices the settings screen offers for the three slots from MANUAL
 * "Settings": the face, the ticks (the dial's ink), and the remaining time.
 *
 * This is the only place the swatch colours live. `Auto` is `null`: it leaves
 * the slot to the theme (light or dark), so the base palette keeps one source of
 * truth in `tokens.css`.
 */

import type { ColorSlot } from '../runtime/settings'

export interface Swatch {
    /** `null` is the Auto option: follow the theme's base colour. */
    value: string | null
    label: string
}

export const SLOT_LABELS: Record<ColorSlot, string> = {
    face: 'Face',
    ticks: 'Ticks',
    remaining: 'Remaining',
}

/**
 * The custom properties each slot drives. The "ticks" slot stands for the whole
 * dial ink family — ticks, numerals, the creator mark — plus the readout text,
 * the corner-control glyphs and the body text, because they read as one ink.
 */
export const COLOR_SLOT_PROPERTIES: Record<ColorSlot, readonly string[]> = {
    face: ['--surface'],
    ticks: ['--dial-mark', '--ink', '--readout', '--control-ink'],
    remaining: ['--remaining'],
}

export const SWATCHES: Record<ColorSlot, readonly Swatch[]> = {
    face: [
        { value: null, label: 'Auto' },
        { value: '#ffffff', label: 'White' },
        { value: '#f4f1ea', label: 'Paper' },
        { value: '#eaf2fb', label: 'Sky' },
        { value: '#22262e', label: 'Slate' },
        { value: '#14161a', label: 'Charcoal' },
    ],
    ticks: [
        { value: null, label: 'Auto' },
        { value: '#14181f', label: 'Ink' },
        { value: '#334155', label: 'Slate' },
        { value: '#1e3a8a', label: 'Navy' },
        { value: '#4b3621', label: 'Brown' },
        { value: '#ffffff', label: 'White' },
    ],
    remaining: [
        { value: null, label: 'Auto' },
        { value: '#e0201b', label: 'Red' },
        { value: '#ea580c', label: 'Orange' },
        { value: '#d97706', label: 'Amber' },
        { value: '#16a34a', label: 'Green' },
        { value: '#2563eb', label: 'Blue' },
        { value: '#7c3aed', label: 'Violet' },
        { value: '#db2777', label: 'Pink' },
    ],
}

/** Writes (or clears) the custom properties a colour slot drives. */
export function applyColorSlot(slot: ColorSlot, value: string | null): void {
    const root = document.documentElement
    for (const property of COLOR_SLOT_PROPERTIES[slot]) {
        if (value === null) {
            root.style.removeProperty(property)
        } else {
            root.style.setProperty(property, value)
        }
    }
}
