# 1-click timer

A simple, slick, and practical countdown timer extension for Google Chrome.

Licensed under GPL. Originally developed using WebStorm.

## Status: Phase 1 — interface rewrite (design preview)

The interface has been rewritten in React + TypeScript, and it runs in a plain
browser so the design can be iterated on quickly:

```bash
npm install
npm run dev     # → http://localhost:5173/popup.html and /fullscreen.html
```

(Vite prints the actual port; it moves to the next free one if 5173 is taken.)

Both pages are the same app in two surfaces: the popup panel and a full-tab
view (there is a button in the transport row to move between them, and the tab
view can go fullscreen). Hover the dial to preview a duration and click to start
it, or click a numeral to start that many minutes.

**Not implemented yet:** persistence across restarts, the toolbar badge,
alarms, notifications, the settings screen, and the alarm sound. Timing is
currently an in-memory mock (`src/app/runtime/mockRuntime.ts`), so the extension
is a live, interactive design preview rather than a usable timer. `MANUAL.md`
describes the finished product and is the source of truth for behaviour.

### Design harness

`npm run dev` renders a development-only row under the controls that parks the
timer in `idle` / `running` / `paused` / `expired`, so each state can be
inspected (and screenshotted) without waiting for a real countdown. It is
stripped from production builds.

The dial has a single face. An earlier experiment with three alternative dial
directions was removed once "Classic dial" was chosen.

Icons are [Lucide](https://lucide.dev) (`lucide-react`), not hand-drawn SVG.
`MANUAL.md` → **UI elements** is the vocabulary the code and the spec share, so
feedback in one of those terms maps to one place in the source.

## Manifest V3 architecture

- **Service worker** (`src/background/index.ts`): manages timer state in
  `chrome.storage.local`, schedules `chrome.alarms` for the timeup event and
  periodic badge updates, and updates the toolbar icon/badge via
  `chrome.action`.
- **UI** (`src/app/`): React. One composition (`TimerApp`) serves both the popup
  and the full-tab view. It reads time through the `TimerRuntime` contract and
  never keeps time itself.
- **Runtime** (`src/app/runtime/`): the contract the UI depends on. Phase 1 ships
  an in-memory mock; Phase 3 adds the `chrome.storage` + messaging
  implementation behind the same interface.
- **Countdown**: state holds an absolute `endTime`, and remaining seconds are
  computed as `max(0, (endTime - Date.now()) / 1000)`. This is what survives
  service-worker termination.

### Key changes from v4 (MV2)

| MV2 (v4)                                       | MV3 (v5)                                              |
| ---------------------------------------------- | ----------------------------------------------------- |
| Persistent background page (`background.html`) | Ephemeral service worker (`background.js`)            |
| `setInterval` countdown (decremental)          | Timestamp-based (`endTime - Date.now()`)              |
| `chrome.extension.getBackgroundPage().timer`   | `chrome.runtime.sendMessage`                          |
| `chrome.browserAction`                         | `chrome.action`                                       |
| Timer state in DOM input `.value`              | Timer state in `chrome.storage.local`                 |
| Audio played in background page                | Audio played in popup; SW uses `chrome.notifications` |

## Development

```bash
npm run dev          # design loop against live pages in the browser
npm run lint         # ESLint
npm run lint:fix     # ESLint with --fix
npm run typecheck    # tsc --noEmit
npm test             # unit tests
npm run test:visual  # browser screenshot tests (needs: npx playwright install chromium)
npm run format       # Prettier write
npm run format:check # Prettier check
npm run build        # unpacked extension → dist/
```

Run `lint`, `typecheck` and `test` before considering a change done.

Load `dist/` as an unpacked extension via `chrome://extensions` (Developer
mode) to try it inside Chrome.

Debug logs are prefixed with `[1-click-timer:sw]` (service worker). View them in
`chrome://extensions` → "Service Worker".

## Next steps

- Remove the **dev bar** (the `State: idle/running/paused/expired` row) from the
  demo page. Note it is also the only way to park a state for screenshots, so the
  visual tests would need another entry point.
- Build the settings screen (MANUAL "Settings"): alarm volume, chime selection,
  face/remaining/ticks colours, reset to defaults.
- UI tweaks.
- Phase 3: the `chrome.storage` + `chrome.alarms` runtime behind `TimerRuntime`,
  so the timer actually persists, badges and rings.

