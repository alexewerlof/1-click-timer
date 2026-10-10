# 1-click timer

A Chrome extension that provides a one-click countdown timer with a visual dial UI.

> **Status: Phase 1 — design preview.** The UI has been rewritten in React and
> runs from the Vite dev server in a plain browser. Timer logic is currently an
> in-memory mock (`src/app/runtime/mockRuntime.ts`); persistence, alarms,
> notifications and the toolbar badge land in Phase 3.
> `MANUAL.md` is the product spec and the source of truth for behaviour.
> See **Roadmap** below for what is next.

## Tech stack

- **TypeScript** (strict, ES2022) + **React 19**
- **Vite 8** — dev server for the browser design loop, and the extension build
- **Zustand** — planned store (Phase 3); the runtime seam it will sit behind exists today
- **CSS Modules + CSS custom properties** — all colours live in `design/tokens.css`
- **Lucide** (`lucide-react`) for control icons
- **Manifest V3** with an ES module service worker
- **Vitest** — node unit tests plus browser-mode visual (screenshot) tests

## Commands

| Command                      | What it does                                       |
| ---------------------------- | -------------------------------------------------- |
| `npm install`                | install dependencies                               |
| `npm run dev`                | Vite dev server → `/popup.html`, `/fullscreen.html` |
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
  app/                 the React UI
    main.tsx           mounts TimerApp; chooses the runtime + dev harness
    TimerApp.tsx       composition shared by both surfaces
    components/        TimerFace, PresetBar, TransportControls, ConfirmReplace, DevBar
    design/            tokens.css (all colours/sizes), global.css
    lib/               dial geometry, time formatting, surface helpers
    runtime/           the TimerRuntime contract and its mock implementation
  background/index.ts  service worker (framework-free TypeScript)
  images/ audio/       toggle icons and the alarm sound
```

## UI vocabulary

`MANUAL.md` → **UI elements** is the canonical list of names for the interface
(face, dial, disc, tick, major tick, numeral, remaining sector, preview arc,
readout, readout disc, caption). The code uses the same words — see
`src/app/lib/dial.ts` and `src/app/components/TimerFace/` — so feedback in one
of those terms maps to one place in the source. There is a single dial face.

## Architecture

```
popup.html / fullscreen.html
  └─ app/main.tsx
       └─ TimerApp ── uses ──> TimerRuntime (runtime/runtime.ts)
            ├─ TimerFace          ├─ mockRuntime   (Phase 1: in-memory, browser)
            │    └─ lib/dial.ts   └─ chromeRuntime (Phase 3: storage + alarms)
            ├─ PresetBar
            └─ TransportControls
background/index.ts (service worker)
  ├─ chrome.storage.local (truth)   └─ chrome.alarms, chrome.action, chrome.notifications
```

The countdown stores an absolute `endTime`; remaining seconds are always computed
as `max(0, (endTime - Date.now()) / 1000)`, so it survives service-worker
termination. The UI never accumulates time.

## Gotchas

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
- `images/bell.svg` and `images/reset.svg` are currently **unreferenced** — they
  belonged to the pre-React popup. They are kept deliberately: the ringing
  overlay (MANUAL) is expected to want the bell. The `logo*.png` files are live
  (manifest, toolbar icon states in `background/index.ts`, notification icon).
- `dist/` is a **design preview** until Phase 3: the dial and controls are live,
  but nothing persists and no `chrome.*` API is used yet.
- `npm run dev` serves `src/` as the web root, so dev URLs match the built
  extension. VS Code Live Server cannot transpile TSX or CSS Modules.

## Roadmap

Phase 1 (the interface, in a browser) is done. What is next, in the order the
product spec implies:

1. Remove the **dev bar** (the `State: idle/running/paused/expired` row,
   `components/DevBar/`) from the demo page. It is also the only way to park a
   state for a deterministic screenshot, so the visual test needs another route
   to the same states before it goes — otherwise it will start capturing
   whatever the mock happens to be doing.
2. **Settings screen** — MANUAL "Settings": add/remove/rename presets, alarm
   volume, chime selection including silent, and the face / remaining / tick
   colours. Those colours are already tokens, so this is wiring a write to the
   same custom properties.
3. Small UI tweaks.
4. **Phase 3** — the real runtime: a `chrome.storage`-backed implementation of
   `TimerRuntime` behind `runtime/runtime.ts`, plus the service worker's alarms,
   badge, notifications and audio. Nothing in `app/` needs to change shape for
   this; `runtime/mockRuntime.ts` is the reference implementation.

Known loose ends, none blocking:

- The creator mark (logo + "Alex Ewerlöf") is off via `SHOW_CREATOR_MARK` in
  `lib/dial.ts`; the component and its styles are still there.
- The counter-clockwise staging puts numerals under the remaining sector's
  translucent fill, so covered numerals read dark-red. Per-numeral staging would
  fix it.
- `MANUAL.md` says 40 sits at the bottom of the dial, which contradicts its own
  5/55 statements. The implemented mapping (uniform 0–60) puts 30 there.
- The store listing copy in `dashboard/` still describes v5 and overstates what
  ships today.

## Deployment

```bash
npm run build
```

Then load `dist/` as an unpacked extension at `chrome://extensions` (Developer
mode). The store listing copy still describes the v5 behaviour — refresh it
before publishing.
