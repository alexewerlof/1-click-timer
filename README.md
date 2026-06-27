# 1-click timer

A simple, slick, and practical countdown timer extension for Google Chrome.

Licensed under GPL. Originally developed using WebStorm.

## Version 5.0 — Manifest V3

This version has been migrated from Manifest V2 to Manifest V3.

### Architecture (MV3)

- **Service Worker** (`src/js/background.js`): Manages timer state via
  `chrome.storage.local`, schedules `chrome.alarms` for the timeup event and
  periodic badge updates, and updates the toolbar icon/badge via
  `chrome.action`.
- **Popup** (`src/js/popup.js`): Runs a local 1-second interval for smooth
  needle rotation and digit display. Communicates with the service worker
  via `chrome.runtime.sendMessage`.
- **Timer state machine** (`src/js/timer.js`): Pure JavaScript, no DOM
  dependencies. Uses absolute `endTime` timestamp — remaining seconds are
  always computed as `max(0, (endTime - Date.now()) / 1000)`.

### Key changes from v4 (MV2)

| MV2 (v4)                                       | MV3 (v5)                                              |
| ---------------------------------------------- | ----------------------------------------------------- |
| Persistent background page (`background.html`) | Ephemeral service worker (`background.js`)            |
| `setInterval` countdown (decremental)          | Timestamp-based (`endTime - Date.now()`)              |
| `chrome.extension.getBackgroundPage().timer`   | `chrome.runtime.sendMessage`                          |
| `chrome.browserAction`                         | `chrome.action`                                       |
| Timer state in DOM input `.value`              | Timer state in `chrome.storage.local`                 |
| Audio played in background page                | Audio played in popup; SW uses `chrome.notifications` |

### Running tests

Open `test/tests.html` in a browser to run the QUnit test suite.

### Development

Load the `src/` directory as an unpacked extension via `chrome://extensions`.

Debug logs are prefixed with `[1-click-timer:sw]` (service worker) or
`[1-click-timer:popup]` (popup). View them in:

- Popup: right-click the extension icon → Inspect
- Service worker: `chrome://extensions` → "Service Worker" link
