# src/ — source code

## Files

| File               | Role                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `manifest.json`    | Extension manifest (MV3). Service worker runs as ES module.                                                                 |
| `popup.html`       | Popup UI. Loads zepto as classic `<script>`, then module `js/popup.ts`.                                                     |
| `popup.css`        | All styles. `#ringing` is `display: none` by default, shown by JS on alarm.                                                 |
| `js/timer.ts`      | Pure state machine. No DOM, no `setInterval`. Timestamp-based countdown. Exported as default.                               |
| `js/background.ts` | Service worker. Manages `chrome.storage.local`, `chrome.alarms`, badge/icon, notifications, message routing.                |
| `js/popup.ts`      | Popup controller. Imports `timer.ts`. Runs local 1s interval for UI. Communicates with SW via `chrome.runtime.sendMessage`. |
| `js/options.js`    | Vestigial — unused.                                                                                                         |
| `types/zepto.d.ts` | Minimal type declarations for the zepto API subset used here.                                                               |
| `images/`          | Extension icons (16/19/48/128) + bell/reset SVGs.                                                                           |
| `audio/song.ogg`   | Alarm sound (looped, played in popup context only).                                                                         |

## Key patterns

- **Timer state**: `{ running, endTime, alarming }` in `chrome.storage.local` keyed `"timerState"`.
- **Alarms**: `"1ct-tick"` (periodic 30s badge update) + `"1ct-timeup"` (one-shot at exact end time).
- **Messages**: Popup sends `start`/`stop`/`reset`/`silent`/`getState`. SW responds with `{success}` or `{running, endTime, alarming, remaining}`.
- **Logging**: All console logs prefixed `[1-click-timer:sw]` or `[1-click-timer:popup]`.
- **Zepto**: Loaded as classic script (UMD, no ESM). Sets `window.$`. Popup accesses it via `$`.
- **Audio**: Played in popup via `new Audio(chrome.runtime.getURL("audio/song.ogg"))`. SW uses `chrome.notifications` for alert when popup is closed.
- **CSS**: `#ringing` has `display: none` — only shown by JS when alarm fires.

## Build pipeline

Vite bundles `popup.html` → `dist/popup.html` (with `js/popup.ts`) and `background.ts` → `dist/js/background.js`. Static assets (manifest, images, audio, zepto from node_modules) are copied by a custom Vite plugin in `vite.config.js`.

## Tests

`test/tests.html` runs QUnit tests for `timer.ts`. Currently JS-only (not TS).
