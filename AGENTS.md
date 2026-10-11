# 1-click timer

A Chrome extension that provides a one-click countdown timer with a visual dial UI.

> **Status: Phase 3 — the real runtime.** The service worker owns the timer in
> `chrome.storage.local` as an absolute `endTime`, so it survives closing the
> popup and restarting Chrome; the toolbar badge counts down and `chrome.alarms`
> raise the notification. The UI talks to it through `TimerRuntime`; a plain
> browser (`npm run dev`) falls back to the in-memory mock. A settings screen
> (`settings.html`) covers appearance (light/dark/auto), the alarm chime, the
> three colours and reset.
> `MANUAL.md` is the product spec and the source of truth for behaviour.

## Tech stack

- **TypeScript** (strict, ES2022) + **React 19**
- **Vite 8** — dev server for the browser design loop, and the extension build
- **Zustand** — installed but unused: the runtime and settings stores are plain `useSyncExternalStore` bindings
- **CSS Modules + CSS custom properties** — all colours live in `design/tokens.css`
- **Lucide** (`lucide-react`) for control icons
- **Manifest V3** with an ES module service worker
- **Vitest** — node unit tests plus browser-mode visual (screenshot) tests

## Commands

| Command                      | What it does                                       |
| ---------------------------- | -------------------------------------------------- |
| `npm install`                | install dependencies                               |
| `npm run dev`                | Vite dev server → `/popup.html`, `/fullscreen.html`, `/settings.html` |
| `npm run build`              | build the unpacked extension into `dist/`          |
| `npm run lint`               | ESLint (flat config)                               |
| `npm run lint:fix`           | ESLint with `--fix`                                |
| `npm run typecheck`          | `tsc --noEmit`                                     |
| `npm test`                   | unit tests (node)                                  |
| `npm run test:visual`        | browser-mode visual tests (screenshot diff)         |
| `npm run test:visual:update` | rewrite the screenshot baselines                   |
| `npm run format`             | Prettier write                                     |
| `npm run format:check`       | Prettier check                                     |

Run `lint`, `typecheck` and `test` before considering a change done. Visual
tests need a browser once per machine: `npx playwright install chromium`.

## Layout

```
src/
  manifest.json        MV3 manifest
  popup.html           popup entry      (data-surface="popup")
  fullscreen.html      tab entry        (data-surface="fullscreen")
  settings.html        settings entry   (data-surface="settings")
  app/                 the React UI
    main.tsx           mounts App
    App.tsx            picks the screen from the surface
    TimerApp.tsx       the timer composition shared by popup + tab
    TimerSurface.tsx   wires the alarm/audio + theme around TimerApp
    SettingsApp.tsx    the settings screen
    components/        TimerFace, TransportControls
    design/            tokens.css (colours/sizes + themes), global.css, palette.ts (swatches)
    lib/               dial geometry, time, surface, links, chimes, fullscreen
    runtime/           TimerRuntime + SettingsStore contracts, mock/chrome impls, hooks
  shared/              timer protocol shared by the UI and the worker
  background/index.ts  service worker (framework-free TypeScript)
  images/              toolbar/store icons
```

## UI vocabulary

`MANUAL.md` → **UI elements** is the canonical list of names for the interface
(face, dial, disc, tick, major tick, numeral, remaining sector, preview arc,
readout, readout disc, readout control, caption). The code uses the same words —
see `src/app/lib/dial.ts` and `src/app/components/TimerFace/` — so feedback in one
of those terms maps to one place in the source. There is a single dial face.

## Architecture

```
popup.html / fullscreen.html / settings.html
  └─ app/main.tsx → App
       ├─ TimerSurface ──> TimerApp ──uses──> TimerRuntime (runtime/runtime.ts)
       │     ├─ useAlarmSound (lib/chimes)      ├─ mockRuntime        (plain browser)
       │     └─ useSettingsTheme                └─ createChromeRuntime (extension)
       └─ SettingsApp ──uses──> SettingsStore (runtime/settingsRuntime.ts)
              ├─ mockSettings   (localStorage)
              └─ chromeSettings (storage.sync, local fallback)
app/ and background/ both import shared/timer.ts (record + reducer + protocol)
background/index.ts (service worker) — the single writer
  ├─ chrome.storage.local (truth)   └─ chrome.alarms, chrome.action, chrome.notifications
```

The countdown stores an absolute `endTime`; remaining seconds are always computed
as `max(0, (endTime - Date.now()) / 1000)`, so it survives service-worker
termination. The UI never accumulates time.

## Gotchas

- **The badge counts whole minutes, never seconds.** The MV3 worker is woken
  about once a minute at best, so a per-second badge would drift. The text is
  `floor(remaining / 60)` with no `m` suffix, and its colour is the fraction of
  the *running* timer that is left (green → orange → red), computed in
  `background/badge.ts`. While `expired` the badge is cleared and the bell icon
  rings instead.
- The dial counts **counter-clockwise**: 0 at 12 o'clock, 5 at 11, 55 at 1, and
  half the dial at the bottom. `MANUAL.md` says 40 sits at the bottom, which
  contradicts its own 5/55 statements; the uniform 0–60 mapping puts 30 there.
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
  signal, and fade back when the pointer leaves the disc. The settings control
  (bottom right) opens `settings.html` in a new tab; the About-the-author link
  inside that screen opens the author's site. The URL and the tab-opening
  primitive live in `app/lib/links.ts`, which is the only place that opens a tab.
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
  asset in the repo. `useAlarmSound` rings the chosen chime while the status is
  `expired` and not muted. The worker only raises the notification — it has no
  audio output.
- `images/` holds only live files — the `logo*.png` set that the manifest, the
  toolbar icon states in `background/index.ts` and the notification use. The
  pre-React popup's `bell.svg`/`reset.svg` were removed; a ringing overlay should
  use the Lucide `Bell` icon, like every other control.
- `dist/` is the real extension now: load it unpacked and the timer persists,
  badges and rings.
- `npm run dev` serves `src/` as the web root, so dev URLs match the built
  extension. VS Code Live Server cannot transpile TSX or CSS Modules.

## Roadmap

Phases 1–3 are done: the interface (in a browser), the settings screen, and the
real `chrome.storage` + `chrome.alarms` runtime. What is next:

1. Small UI tweaks (see the loose ends below).
2. A ringing overlay for the UI (use the Lucide `Bell` icon).
3. Refresh the Chrome Web Store listing copy in `dashboard/`.

Known loose ends, none blocking:

- The counter-clockwise staging puts numerals under the remaining sector's
  translucent fill, so covered numerals read dark-red. Per-numeral staging would
  fix it.
- `MANUAL.md` says 40 sits at the bottom of the dial, which contradicts its own
  5/55 statements. The implemented mapping (uniform 0–60) puts 30 there.
- The alarm rings only while a timer surface is open (audio is played in the UI,
  not the worker); with the popup closed only the notification fires.

## Deployment

```bash
npm run build
```

Then load `dist/` as an unpacked extension at `chrome://extensions` (Developer
mode). Debug logs are prefixed `[1-click-timer:sw]` (view them from the
service-worker inspector). The store listing copy still describes the v5
behaviour — refresh it before publishing.
