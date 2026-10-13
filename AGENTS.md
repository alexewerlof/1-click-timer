# 1-click timer

A Chrome extension that provides a one-click countdown timer with a visual dial UI.

> **Status: Phase 4 — the alarm.** The service worker owns the timer in
> `chrome.storage.local` as an absolute `endTime`, so it survives closing the
> popup and restarting Chrome; the toolbar badge counts down and `chrome.alarms`
> raise the notification. The alarm sound is played by an offscreen document, so
> it rings even with no timer surface open, for a length the settings choose; the
> notification stays until it is closed, and closing it — or the timer's own
> controls — silences the alarm and resets the timer. On expiry the worker brings a
> timer surface to the front (focusing the fullscreen tab if one is open, raising
> its window), and the toolbar shows a red alert icon while the alarm rings. The UI
> talks to the runtime through `TimerRuntime`; a plain browser (`npm run dev`) falls
> back to the in-memory mock. A settings screen (`settings.html`) covers appearance
> (light/dark/auto), the alarm chime and ring length, the three colours and reset.

## Tech stack

- **TypeScript** (strict, ES2022) + **React 19**
- **Vite 8** — dev server for the browser design loop, and the extension build
- **Zustand** — installed but unused: the runtime and settings stores are plain `useSyncExternalStore` bindings
- **CSS Modules + CSS custom properties** — all colours live in `design/tokens.css`
- **Lucide** (`lucide-react`) for control icons
- **Manifest V3** with an ES module service worker
- **Vitest** — node unit tests plus browser-mode visual (screenshot) tests
- **`@resvg/resvg-js`** — rasterises the one committed icon SVG into every PNG
  size Chrome asks for, at build time

## The other docs

| File                | For        | Holds                                                                                                         |
| ------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `README.md`         | users      | what it is, who it is for, installing it, the how-tos, privacy and links                                       |
| `CONTRIBUTING.md`   | developers | setup, every command, the layout, testing, conventions and the release process                                 |
| `CHROMEWEBSTORE.md` | releasing  | the store listing copy, the per-permission justifications, the privacy disclosure and the submission checklist |
| `PRIVACY.md`        | users      | the privacy policy the store listing links to                                                                  |
| `src/AGENTS.md`     | developers | the file-by-file map of `src/`, and its key patterns                                                           |

Setup, commands, testing and the release process live in `CONTRIBUTING.md`, the
single source for them — they are not repeated here.

## UI vocabulary

This is the canonical list of names for the interface, and the code uses the same
words — see `src/app/lib/dial.ts` and `src/app/components/TimerFace/` — so feedback
given in one of these terms maps to one place in the source. There is a single dial
face.

| Term                 | What it is                                                                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Face**             | The square SVG surface that holds everything below. It fills the space it is given.                                                                                             |
| **Dial**             | The circular instrument as a whole: the disc, its ticks and its numerals.                                                                                                       |
| **Disc**             | The circle at the centre of the dial. The ticks straddle its edge, and the remaining sector fills it.                                                                           |
| **Tick**             | A short line marking a single minute.                                                                                                                                          |
| **Minor tick**       | A tick on a minute that is not a multiple of five.                                                                                                                             |
| **Major tick**       | The thicker tick on each multiple of five (0, 5, 10, … 55).                                                                                                                    |
| **Numeral**          | The number printed beside a major tick: 0, 5, 10, … 55. Each is itself a one-click shortcut to its own duration.                                                                 |
| **Numeral ring**     | The circle the numerals sit on, just outside the ticks.                                                                                                                        |
| **Remaining sector** | The filled wedge. It runs from 12 o'clock counter-clockwise to the current remaining time and reaches the centre, so its size is the time left.                                 |
| **Preview arc**      | The unfilled outline from 12 o'clock to the minute under the pointer. It shows what a click would start.                                                                        |
| **Preview ticks**    | The ticks inside the preview arc's span, drawn in the **Remaining sector**'s colour so the arc, its numeral and the ticks it covers read as one mark. The rest of the ring keeps the dial's ink. |
| **Preview numeral**  | The single numeral shown while previewing, on the numeral ring at the end of the preview arc, in the numerals' style and the remaining sector's colour. It replaces the whole numeral ring, so it is the only number on the face. A whole turn (60) is labelled where the 0 numeral sits. |
| **Readout**          | The digital `M:SS` in the middle of the disc, e.g. `1:05`. It always shows the remaining time, except while the timer is idle — when it is left blank, because a standing `0:00` only adds noise — and while the **Readout control** replaces it. |
| **Readout disc**     | The small circle behind the readout, at the centre of the dial. White with a soft shadow, so it reads as a layer above the dial rather than a hole in it.                       |
| **Readout control**  | The round button on the readout disc, whose click surface is the whole disc. Pause while the timer runs, resume while it is paused, restart while the alarm is ringing. Revealed on hover or focus, and always shown where there is no hover. |
| **Caption**          | The text "Made in Sweden", inscribed inside the disc on a circular path just above the bottom rim.                                                                             |
| **Creator mark**     | The "Alex Ewerlöf" wordmark, drawn in the dial's ink, in the band between the readout disc and the 0 numeral.                                                                  |
| **Face slot**        | The region that holds the face. The **Transport** controls overlay it, so the face gets the whole slot.                                                                         |
| **Transport**        | The four corner controls, one per corner of the dial's square: mute (top left), fullscreen (top right), reset (bottom left) and settings (bottom right). Ghost glyphs, black by default and red on hover, fading out while the dial is previewed. Pause/resume and restart live on the **Readout control**. |
| **Settings control** | The bottom-right corner control: a gear that opens the settings screen in a tab of its own.                                                                                     |

Three measures run through the geometry: **disc radius**, **tick length** (how far
a tick extends across the disc edge) and **numeral radius**.

Behaviour cited in code comments — "Set a custom timer", "Stop a timer", "Restart
the timer", "Full screen", "Settings", "Notification", "Features" — is described
for users in `README.md`, under "How to use" and "Features".

## Architecture

```
popup.html / fullscreen.html / settings.html
  └─ app/main.tsx → App (theme via useSettingsTheme)
       ├─ TimerApp ──uses──> TimerRuntime (runtime/runtime.ts)
       │                          ├─ mockRuntime         (plain browser)
       │                          └─ createChromeRuntime (extension)
       └─ SettingsApp ──uses──> SettingsStore (runtime/settingsRuntime.ts)
              ├─ mockSettings   (localStorage)
              └─ chromeSettings (storage.sync, local fallback)
app/ and background/ both import shared/timer.ts (record + reducer + protocol)
background/index.ts (service worker) — the single writer
  ├─ chrome.storage.local (truth)   └─ chrome.alarms, chrome.action, chrome.notifications, chrome.tabs
  └─ offscreen.html (offscreen/offscreen.ts) — the alarm audio, over shared/offscreen.ts
```

The countdown stores an absolute `endTime`; remaining seconds are always computed
as `max(0, (endTime - Date.now()) / 1000)`, so it survives service-worker
termination. The UI never accumulates time.

## Gotchas

- **The badge counts whole minutes, never seconds.** The MV3 worker is woken
  about once a minute at best, so a per-second badge would drift. The text is
  `floor(remaining / 60)` with no `m` suffix, and its colour is the fraction of
  the *running* timer that is left (green → orange → red), computed in
  `background/badge.ts`. While `expired` the badge is cleared; for as long as the
  alarm rings the toolbar then shows the alert icon (`background/alarm.ts`), so the
  icon and the sound cannot drift apart.
- The dial counts **counter-clockwise**: 0 at 12 o'clock, 5 at 11, 55 at 1, and
  half the dial at the bottom. The uniform 0–60 mapping puts **30** there — not 40,
  which an earlier draft of the spec claimed while contradicting its own 5/55
  statements.
- Never rely on the rendered box matching the viewBox. Pointer positions are
  converted with `SVGElement.getScreenCTM()` (see `lib/dial.ts`).
- Colours, sizes and dial weights are **tokens** in `design/tokens.css`. Change
  them there, never in a component. The exceptions are all **derived** from the
  geometry in `lib/dial.ts` rather than picked by eye: the readout font size
  (`readoutFontSizeFor`) and the two shadows (`READOUT_SHADOW`,
  `DISC_INNER_SHADOW`, both from `shadowFor`). Hand picked values drift the
  moment the geometry is tuned, and did.
- The shadows are inline SVG filters, because SVG has no `box-shadow`: the
  readout disc's `feDropShadow`, and the disc's own inner shadow, which
  subtracts an offset copy of the disc from itself. See `src/AGENTS.md` for the
  two settings that are easy to get wrong (`sRGB` interpolation, and a filter
  region wide enough not to clip). The disc has no outline — the inner shadow is
  what draws its edge.
- The readout disc carries its own pause/resume control (`ReadoutControl`) — the
  only HTML element in the face. It is a `<button>` overlaid on the SVG (never
  *in* it), sized from `READOUT_DISC_DIAMETER_RATIO` × `cqmin`, revealed on
  hover/focus and always visible where there is no hover.
- The mute, fullscreen, reset and settings buttons are the **corner controls**:
  ghost glyphs (black, red on hover) pinned to the corners of the dial's square
  rather than a row of their own, so the face gets the whole slot. They live in
  `TransportControls` as a sibling of the face; the square is the letterboxed SVG
  viewBox, so the overlay offsets itself by half the letterbox margin, and their
  sizes are `cqmin` tokens so they scale with the dial. While the dial is
  previewed they fade out with the numerals, keyed off the face's `data-pickable`
  signal, and fade back when the pointer leaves the disc. The fullscreen control
  (top right) opens the fullscreen timer, or focuses the tab that already has it
  (in whatever window), so there is a single fullscreen view at a time. The
  settings control (bottom right) opens `settings.html` in a new tab. That
  screen's footer holds the only three ways out — the author's site, the source
  code and the issue tracker. The outbound URLs and the tab-opening primitive for
  them live in `app/lib/links.ts`; extension pages are opened through
  `shared/surfaces.ts`'s `revealSurface` (which the worker's alarm uses too).
- **Two runtimes behind one seam.** `runtime.ts` picks `createChromeRuntime()`
  when `isExtension()` (see `app/runtime/platform.ts`) and the mock otherwise;
  `settingsRuntime.ts` does the same for settings. Build the chrome runtimes
  **lazily, inside the seam** — a module-level singleton is evaluated in the plain
  browser too, where `chrome.storage` is undefined and the app crashes before it
  can choose the mock.
- **Themes are `data-theme`, not components.** `useSettingsTheme` sets
  `data-theme` on `<html>` and writes the three colour overrides as inline custom
  properties. `tokens.css` keeps the **light** palette in `:root` and overrides it
  in `[data-theme='dark']`; a timer surface left on Auto renders light in the
  screenshot tests, so the baselines only move if a colour actually changes.
- **Chimes are synthesised**, not files (`app/lib/chimes.ts`) — there is no audio
  asset in the repo. The alarm is played by an **offscreen document**
  (`offscreen/offscreen.ts`), which the worker creates, because an MV3 worker has
  no `AudioContext`. The worker sends a `ring` message for the settings' ring
  length; the page stops itself and reports `ring-ended`, so the alert icon is
  dropped without anything polling. The settings screen previews a chime in its own
  page, from a real click.
- **The notification is the control when no surface is open.** It sets
  `requireInteraction` so it stays put until the user acts: closing it resets the
  timer, and clicking its body brings the timer to the front. `onClosed` (only when
  `byUser`, so our own `clear` is ignored) **resets the timer to idle** — so
  dismissing the notice can never leave a ring for a timer the user has
  acknowledged. The ring's end time is the record's `ringUntil`, an absolute ms
  stamp (not a countdown), so it survives service-worker termination like `endTime`.
- **Expiry is handled once.** `handleTimeup` guards against the timeup alarm and
  the periodic tick both noticing the same expiry (they run across `await`s, so
  without the guard both fire): an in-memory flag plus a `status === 'running'`
  check. Before that guard the alarm could raise two notifications and open two
  tabs.
- **Bringing the surface forward needs no `tabs` permission.**
  `shared/surfaces.ts`'s `revealSurface` uses `chrome.runtime.getContexts({ contextTypes: ['TAB'] })`
  (Chrome 116+) to find an open `fullscreen.html` or `popup.html` tab and focus it
  (raising its window with `chrome.windows.update`), and `chrome.tabs.create` to
  open the fullscreen page only when none is open — so there is a single fullscreen
  view at a time. The UI's fullscreen control uses the same helper, so it focuses an
  existing tab instead of opening a second. Opening and focusing tabs do not require
  `tabs`. The `offscreen` permission is the only one this alarm work added.
- **The app icon is generated, the UI icons are Lucide.** `images/icon.svg` is
the only committed icon art (100×100). `npm run build` rasterises it into the six
PNG sizes Chrome wants — 16, 19, 32, 38, 48 and 128 — straight into `dist/`, so
the PNGs are build artifacts and not in the repo; `scripts/icons/render.ts` does
the rasterising and `shared/icons.ts` is the one list of sizes and paths. The
build fails if `manifest.json` names an icon it does not produce. `images/` holds
nothing else now: the pre-React popup's `bell.svg`/`reset.svg` and the hand-made
`logo*.png` set are gone, and so is the `vector/` folder they came from. A
ringing overlay in the UI should use the Lucide `Bell` icon, like every other
control.
- `dist/` is the real extension now: load it unpacked and the timer persists,
  badges and rings.
- `npm run dev` serves `src/` as the web root, so dev URLs match the built
  extension. VS Code Live Server cannot transpile TSX or CSS Modules.

## Roadmap

Phases 1–4 are done: the interface (in a browser), the settings screen, the real
`chrome.storage` + `chrome.alarms` runtime, and the alarm — a configurable-length
ring played from an offscreen document, dismissible from the notification, with a
red alert toolbar icon and the timer brought to the front. What is next:

1. Small UI tweaks (see the loose ends below).
2. The store screenshots and the promo tile: `npm run screenshots` builds `dist/`,
   drives the packed extension in Chromium and writes the gallery to the
   gitignored `dashboard/screenshots/` (`scripts/store/`). The v4 set was deleted
   on 2026-10-11: it showed the pre-React interface.

Known loose ends, none blocking:

- An earlier version of the spec said 40 sits at the bottom of the dial, while
  contradicting its own 5/55 statements. The implemented mapping (uniform 0–60)
  puts 30 there.
- **`chrome.action.setIcon` wants absolute URLs.** `background/index.ts` wraps its
  paths in `chrome.runtime.getURL()`: a path relative to the install directory is
  rejected with "Failed to fetch" for an unpacked extension, even though the same
  file fetches fine from the worker. The rejection is caught and logged rather
  than thrown, so a regression here is quiet — the manifest's `default_icon`
  covers for it and the toolbar keeps its normal art.
- **The icon's ring is a hairline.** At 100 units the stroke is 2.655 wide, so it
  rasterises to well under a pixel at 16 and 19 — the red sector carries those
  sizes and the dial reads only as a suggestion. Redrawing the source with a
  heavier ring is the fix; a thicker stroke would change the 128px art too.

Decisions still open, none blocking:

- **The store link.** `README.md` says to install from the Chrome Web Store but
  carries no URL: the listing was never recorded in the repo, and 5.0.0 is not
  published yet. Add the link once it is.
- **`dashboard/` is now empty** apart from the gitignored `package/` folder that
  `npm run deploy` writes. Either keep it (the v4 convention) or move the release
  ZIPs to a root `packages/`.
- **The settings footer uses `<button>` + `openTab`**, not anchors, so users lose
  right-click → "Copy link address" and middle-click. Real `<a>`s would be more
  semantic, but they would break the "`app/lib/links.ts` is the only place that
  opens a tab" rule and its tests.
- **The `AGENTS.md "Term"` citations in ~25 source files** could be dropped in
  favour of the single statement in "UI vocabulary"; they couple code comments to
  doc headings.
- **No visual test covers the settings screen** — `TimerApp.visual.test.tsx` is
  the only browser project, so a footer change is invisible to the screenshot
  suite.

## Deployment

```bash
npm run build     # unpacked extension → dist/
npm run deploy    # lint + typecheck + test + build, then ZIP the release
```

Load `dist/` as an unpacked extension at `chrome://extensions` (Developer mode).
Debug logs are prefixed `[1-click-timer:sw]` (view them from the
service-worker inspector).

`npm run deploy` ends in `scripts/package.sh`, which writes
`dashboard/package/1-click-timer-<version>.zip` holding the *contents* of `dist/`
so `manifest.json` sits at the archive root. It prefers `zip(1)` and falls back to
`python3` — this machine has no `zip`, so it uses Python. The output folder is
gitignored.

`CHROMEWEBSTORE.md` is the copy-paste source for the listing, the permission
justifications and the privacy disclosure; `PRIVACY.md` is the policy that listing
links to. The old `dashboard/` store copy and the v4 screenshots were removed on
2026-10-11 — that folder now holds only release artifacts.
