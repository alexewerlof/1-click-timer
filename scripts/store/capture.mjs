#!/usr/bin/env node
/**
 * Captures the Chrome Web Store gallery from the built extension.
 *
 * It loads `dist/` into Playwright's own Chromium (Chrome-branded builds refuse
 * `--load-extension`), drives the timer into each state through the real UI, and
 * writes the images into `dashboard/screenshots/`: the screenshots at 1280×800,
 * which is the size the store asks for, and the promo tile at 440×280. That
 * folder is gitignored — the captures are reproducible from this script, and a
 * committed gallery goes stale the moment the interface moves (the v4 set was
 * deleted for exactly that).
 *
 * Run it through `npm run screenshots`, which builds first.
 */

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DIST = join(ROOT, 'dist')
const OUT = join(ROOT, 'dashboard', 'screenshots')
const TOKENS = join(ROOT, 'src', 'app', 'design', 'tokens.css')
const TILE_PAGE = join(ROOT, 'scripts', 'store', 'promo-tile.html')

/** 1280×800: the size the store prefers for screenshots. */
const SHOT = { width: 1280, height: 800 }
/** The one promo-tile size worth having — the small tile, for placements. */
const TILE = { width: 440, height: 280 }

/** The gallery shows a timer part-way through, because that is the product. */
const HERO_MINUTES = 25
/** The previewed minute, chosen outside the remaining span so the arc reads. */
const PREVIEW_MINUTES = 40

/** A pointer parked off the dial, so nothing is left hovered or previewed. */
const AWAY = { x: 6, y: SHOT.height - 6 }

/**
 * The screenshots sit on a plain backdrop rather than in a browser frame: the
 * popup is a real 380×380 panel, and no device mockup is added around it (the
 * store's review checklist counts invented chrome as misleading).
 */
const POPUP_FRAME = `
    html, body { background: #eef1f5; }
    #root {
        position: absolute;
        inset: 0;
        margin: auto;
        border-radius: 14px;
        background: var(--surface);
        box-shadow: 0 18px 50px rgb(15 23 42 / 22%);
        overflow: hidden;
    }
`

// The promo tile's artwork is the same dial with the corner controls and the
// numeral ring hidden: a marketing tile wants the instrument, not the buttons,
// and the numerals would collide with the tile's own copy.
const DIAL_ONLY = '[aria-label="Timer controls"], [data-dial-numerals] { visibility: hidden !important; }'

/**
 * Chromium derives an unpacked extension's id from its path: the first 32 hex
 * digits of the SHA-256, each nibble mapped onto a–p.
 */
function unpackedExtensionId(path) {
    const hash = createHash('sha256').update(path).digest('hex').slice(0, 32)
    return [...hash].map((nibble) => String.fromCharCode(97 + Number.parseInt(nibble, 16))).join('')
}

/** Waits for the fresh profile to record the extension, and returns its id. */
async function waitForExtensionId(profile) {
    const preferences = join(profile, 'Default', 'Preferences')
    const derived = unpackedExtensionId(DIST)

    for (let attempt = 0; attempt < 60; attempt += 1) {
        try {
            const settings = JSON.parse(readFileSync(preferences, 'utf8')).extensions?.settings ?? {}
            const ids = Object.keys(settings)
            if (ids.length > 0) return ids.includes(derived) ? derived : ids[0]
        } catch {
            // Preferences lands a moment after launch; keep waiting.
        }
        await new Promise((done) => setTimeout(done, 250))
    }

    throw new Error('the extension never registered in the fresh profile')
}

/**
 * Refuses to shoot a browser that reports no hover. The check is not decoration:
 * the face keeps its readout control visible where there is no hover
 * (`@media (hover: none)`), and headless Chromium reports exactly that — which
 * would pin the readout control open over the countdown in every shot. The
 * launch flags claim a desktop pointer; this is what proves they took.
 */
async function assertDesktopPointer(page) {
    const desktopPointer = await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)
    if (!desktopPointer)
        throw new Error('this browser reports no hover, so the readout control would cover the readout')
}

/** The fullscreen surface, mounted, with the pointer parked off the dial. */
async function openFace(context, id) {
    const page = await context.newPage()
    await page.setViewportSize(SHOT)
    await page.goto(`chrome-extension://${id}/fullscreen.html`)
    await page.waitForSelector('svg[role="slider"]')
    await assertDesktopPointer(page)
    await page.mouse.move(AWAY.x, AWAY.y)
    return page
}

/** Crops a screenshot to a fixed size, so the tile is exactly 440×280. */
async function shoot(page, name, { clip } = {}) {
    await page.screenshot({ path: join(OUT, name), ...(clip ? { clip } : {}) })
    console.log(`screenshots: wrote ${name}`)
}

if (!existsSync(join(DIST, 'manifest.json'))) {
    console.error('screenshots: nothing built in dist/ — run `npm run build` first')
    process.exit(1)
}

mkdirSync(OUT, { recursive: true })

const profile = mkdtempSync(join(tmpdir(), 'timer-capture-'))
const context = await chromium.launchPersistentContext(profile, {
    viewport: SHOT,
    deviceScaleFactor: 1,
    // Playwright disables extensions unless the default arg is dropped, and
    // `headless: false` plus an explicit new-headless arg is what actually
    // loads one — plain headless silently installs nothing.
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [
        `--load-extension=${DIST}`,
        '--headless=new',
        '--hide-scrollbars',
        // Headless Blink reports no hover, which the face answers by pinning its
        // readout control open; this claims a desktop mouse.
        '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4',
    ],
})

try {
    const id = await waitForExtensionId(profile)
    console.log(`screenshots: extension ${id}`)

    // 1 — the idle face, which is what the toolbar icon opens.
    const face = await openFace(context, id)
    await shoot(face, '01-idle.png')

    // 2 — a timer part-way through: the sector, the readout and the badge state.
    await face.locator(`text[data-numeral-minutes="${HERO_MINUTES}"]`).click()
    await face.waitForSelector('[class*="sector"]')
    await face.mouse.move(AWAY.x, AWAY.y)
    await face.waitForTimeout(400)
    await shoot(face, '02-running.png')

    // 3 — previewing: the arc to the minute under the pointer, the numeral ring
    // faded out around that one numeral, and the corner controls faded out.
    const atPreview = await face.evaluate((minutes) => {
        const svg = document.querySelector('svg')
        const disc = svg.querySelector('circle[class*="disc"]')
        const centre = { x: Number(disc.getAttribute('cx')), y: Number(disc.getAttribute('cy')) }
        // A hair inside the rim, on the counter-clockwise mapping `lib/dial.ts`
        // owns: 0 at 12 o'clock, increasing to the left.
        const radius = Number(disc.getAttribute('r')) - 8
        const angle = (2 * Math.PI * minutes) / 60
        const point = new DOMPoint(
            centre.x - radius * Math.sin(angle),
            centre.y - radius * Math.cos(angle),
        ).matrixTransform(svg.getScreenCTM())
        return { x: point.x, y: point.y }
    }, PREVIEW_MINUTES)

    await face.mouse.move(atPreview.x, atPreview.y)
    // The preview is driven by a pointermove, and the numeral only exists once
    // the minute resolves — so wait for it rather than for a fixed delay.
    const previewNumeral = await face
        .waitForSelector('[class*="previewNumeral"]', { timeout: 5000 })
        .then((handle) => handle.evaluate((node) => node.textContent))
    if (Number(previewNumeral) !== PREVIEW_MINUTES) {
        throw new Error(`the pointer at ${PREVIEW_MINUTES} minutes previewed ${previewNumeral}`)
    }
    await shoot(face, '03-preview.png')
    await face.mouse.move(AWAY.x, AWAY.y)
    await face.close()

    // 4 — the popup at its true 380×380, on a plain backdrop. The timer is still
    // running, because the timer lives in the worker and both surfaces read it.
    const popup = await context.newPage()
    await popup.setViewportSize(SHOT)
    await popup.goto(`chrome-extension://${id}/popup.html`)
    await popup.waitForSelector('svg[role="slider"]')
    await assertDesktopPointer(popup)
    await popup.addStyleTag({ content: POPUP_FRAME })
    await popup.mouse.move(AWAY.x, AWAY.y)
    await shoot(popup, '04-popup.png')
    await popup.close()

    // 5 — the settings screen, in the light theme.
    const settings = await context.newPage()
    await settings.setViewportSize(SHOT)
    await settings.goto(`chrome-extension://${id}/settings.html`)
    await settings.waitForSelector('main')
    await shoot(settings, '05-settings.png')

    // 6 — the dark theme, chosen the way a user chooses it (the same `sync`
    // store the extension ships), so the shot cannot show a theme it cannot
    // reach.
    const appearance = settings.getByRole('radiogroup', { name: 'Appearance' })
    await appearance.getByRole('radio', { name: 'Dark' }).click()
    await settings.waitForTimeout(200)

    const dark = await openFace(context, id)
    await dark.waitForFunction(() => document.documentElement.dataset.theme === 'dark')
    await dark.waitForSelector('[class*="sector"]')
    await shoot(dark, '06-dark.png')
    await dark.close()

    // Back to the light theme for the tile, then take its artwork.
    await appearance.getByRole('radio', { name: 'Light' }).click()
    await settings.waitForTimeout(200)
    await settings.close()

    const art = await openFace(context, id)
    await art.addStyleTag({ content: DIAL_ONLY })
    await art.waitForSelector('[class*="sector"]')
    const artwork = join(OUT, '.dial-hero.png')
    await art.screenshot({ path: artwork })
    await art.close()

    // 7 — the promo tile. Colours and type come from the app's own tokens, and
    // the dial arrives as a data URL so the tile depends on nothing but itself.
    const tile = await context.newPage()
    await tile.setViewportSize(SHOT)
    await tile.goto(pathToFileURL(TILE_PAGE).href)
    await tile.addStyleTag({ path: TOKENS })
    await tile.evaluate(
        (source) => {
            document.querySelector('#dial').src = source
        },
        `data:image/png;base64,${readFileSync(artwork).toString('base64')}`,
    )
    await tile.evaluate(() => document.fonts.ready)
    await shoot(tile, 'promo-440x280.png', { clip: { x: 0, y: 0, ...TILE } })
    await tile.close()

    unlinkSync(artwork)

    console.log(`screenshots: ${OUT}`)
} finally {
    await context.close()
    rmSync(profile, { recursive: true, force: true })
}
