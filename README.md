# 1-click timer

A simple, slick, and practical countdown timer extension for Google Chrome.

Licensed under GPL. Originally developed using WebStorm.

## Status: Phase 3 — the real runtime

The extension is usable. The timer is owned by the service worker in
`chrome.storage.local` as an absolute end time, so it survives closing the popup
and restarting Chrome; the toolbar badge counts down, `chrome.alarms` raise the
"time is up" notification, and the alarm sound plays in the UI. The popup, the
full-tab view and the settings screen are all live.

The React interface still runs in a plain browser for fast iteration:

```bash
npm install
npm run dev     # → http://localhost:5173/popup.html, /fullscreen.html, /settings.html
```

(Vite prints the actual port; it moves to the next free one if 5173 is taken.)

In a plain browser the `chrome.*` APIs are absent, so `src/app/runtime/` falls
back to the in-memory mock (`mockRuntime.ts`) and settings fall back to
`localStorage` (`mockSettings.ts`); the layout, the themes and the settings screen
behave the same. `MANUAL.md` describes the product and is the source of truth for
behaviour.

### The dial

Hover the dial to preview a duration and click to start it, or click a numeral to
start that many minutes. There is a single dial face; an earlier experiment with
alternative dial directions was removed once "Classic dial" was chosen.

Icons are [Lucide](https://lucide.dev) (`lucide-react`), not hand-drawn SVG.
`MANUAL.md` → **UI elements** is the vocabulary the code and the spec share, so
feedback in one of those terms maps to one place in the source.

## Manifest V3 architecture

- **Service worker** (`src/background/index.ts`): the single writer of timer
  state in `chrome.storage.local`. It schedules `chrome.alarms` for the timeup
  event and periodic badge updates, updates the toolbar icon/badge via
  `chrome.action`, and raises the notification via `chrome.notifications`.
- **UI** (`src/app/`): React. One composition (`TimerApp`) serves the popup and
  the full-tab view, and a settings screen (`SettingsApp`) covers appearance,
  alarm and colours. It reads time through `TimerRuntime` and never keeps time
  itself.
- **Runtime** (`src/app/runtime/`): the contracts the UI depends on. The
  extension uses `chromeRuntime` (`chrome.storage` + messaging); a plain browser
  falls back to the in-memory mock. Settings follow the same pattern with
  `chromeSettings` / `mockSettings`.
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

- UI tweaks (see the loose ends in `AGENTS.md`).
- A ringing overlay for the UI (Lucide `Bell`).
- Refresh the Chrome Web Store listing copy in `dashboard/`.

