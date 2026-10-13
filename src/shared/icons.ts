/**
 * The extension's icon set: the sizes Chrome asks for, and where each PNG sits
 * inside the extension.
 *
 * One source of truth for the three things that must agree:
 *
 * - `manifest.json` declares the paths Chrome loads for the toolbar and the
 *   store listing,
 * - the service worker sets the toolbar and the notification icon at runtime,
 * - `scripts/icons/render.ts` rasterises `images/icon.svg` into exactly these
 *   sizes at build time, and the build fails if the manifest names something it
 *   does not produce.
 *
 * `src/images/icon.svg` is the source art; the PNGs are build artifacts, written
 * into the gitignored `dist/`.
 */

/** Every size the icon is rasterised at, ascending. */
export const ICON_SIZES = [16, 19, 32, 38, 48, 128] as const

export type IconSize = (typeof ICON_SIZES)[number]

export function isIconSize(size: number): size is IconSize {
    return (ICON_SIZES as readonly number[]).includes(size)
}

/** The folder holding the icons, relative to the extension root. */
export const ICON_DIRECTORY = 'images'

export function iconFileName(size: IconSize): string {
    return `icon${size}.png`
}

/** An icon's path inside the extension, e.g. `images/icon128.png`. */
export function iconPathFor(size: IconSize): string {
    return `${ICON_DIRECTORY}/${iconFileName(size)}`
}

/**
 * The size a path names, or `null` when it names no icon of ours. A leading
 * slash is fine, so the dev server's request URL and the manifest's path both
 * go through it.
 */
export function iconSizeFromPath(path: string): IconSize | null {
    const match = /(?:^|\/)icon(\d+)\.png$/.exec(path)
    const size = match === null ? Number.NaN : Number(match[1])
    return isIconSize(size) ? size : null
}
