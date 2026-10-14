/**
 * Rasterises the icon source into the PNGs Chrome needs.
 *
 * `src/images/icon.svg` is the only committed icon art, so a design change is
 * one file and never a set of hand-exported sizes. `vite build` writes the PNGs
 * into `dist/images/` (the `iconAssets` plugin in `vite.config.ts`), and the dev
 * server answers the same URLs from memory — `src/` is the web root there, and a
 * browser asking for a favicon knows nothing about a build.
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import { ALERT_ICON_SIZES, ICON_SIZES, type AlertIconSize, type IconSize } from '../../src/shared/icons'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** The committed source art. */
export const ICON_SOURCE = resolve(ROOT, 'src', 'images', 'icon.svg')

/** The committed art for the alert icon shown while the alarm rings. */
export const ALERT_ICON_SOURCE = resolve(ROOT, 'src', 'images', 'icon-alert.svg')

/** Rasterising is not free, and the dev server asks once per request. */
let cache: Map<IconSize, Buffer> | null = null
let alertCache: Map<AlertIconSize, Buffer> | null = null

/**
 * Every icon as a PNG buffer, keyed by size. The source's `viewBox` is square,
 * so fitting to the width gives exact squares.
 */
export function renderIcons(): Map<IconSize, Buffer> {
    if (cache !== null) return cache

    const svg = readFileSync(ICON_SOURCE, 'utf8')
    const icons = new Map<IconSize, Buffer>()
    for (const size of ICON_SIZES) {
        const image = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render()
        icons.set(size, Buffer.from(image.asPng()))
    }

    cache = icons
    return cache
}

/**
 * The toolbar alert icon, at the two sizes the toolbar uses. Not in the
 * manifest — the worker swaps to it at runtime — so the build writes it without
 * the manifest check the dial icons get.
 */
export function renderAlertIcons(): Map<AlertIconSize, Buffer> {
    if (alertCache !== null) return alertCache

    const svg = readFileSync(ALERT_ICON_SOURCE, 'utf8')
    const icons = new Map<AlertIconSize, Buffer>()
    for (const size of ALERT_ICON_SIZES) {
        const image = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render()
        icons.set(size, Buffer.from(image.asPng()))
    }

    alertCache = icons
    return alertCache
}
