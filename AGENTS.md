# 1-click timer

A Chrome extension that provides a one-click countdown timer with a visual dial UI.

## Tech stack

- **TypeScript** (strict mode, ES2020 target)
- **Vite** (build only — no dev server needed)
- **Zepto** (lightweight jQuery alternative, loaded as classic `<script>`)
- **Manifest V3** with ES module service worker
- **Chrome APIs**: `chrome.action`, `chrome.alarms`, `chrome.notifications`, `chrome.storage.local`

## Key commands

```bash
npm install          # install dependencies
npm run build        # clean dist/ and build
npm test             # open test/tests.html in a browser
```

## Deployment

Load `dist/` as an unpacked extension at `chrome://extensions` (enable Developer mode).

## Architecture

```
popup (popup.html)                    service worker (background.ts)
  ├─ timer.ts (local state)             ├─ chrome.storage.local (truth)
  ├─ setInterval 1s → UI updates        ├─ chrome.alarms (tick + timeup)
  └─ sendMessage() ←→ SW               ├─ chrome.action (badge/icon)
                                         └─ chrome.notifications (alert)
```

The timer stores an absolute `endTime` timestamp. Remaining seconds are always
computed as `max(0, (endTime - Date.now()) / 1000)`. This survives service worker
termination — no reliance on `setInterval` in the background.
