# Chrome Web Store Listing — 1-click timer

> Last Updated: 2026-10-14

The single source of truth for everything typed into the Chrome Developer
Dashboard. Copy from here, not from memory. `PRIVACY.md` and `dashboard/` are the
companions: the policy is the hosted page, this file is the listing.

## Store Item

| Field             | Value                                                                   |
| ----------------- | ----------------------------------------------------------------------- |
| Item id           | `igloknlllonknnbkfgggfkigmeegmakf`                                       |
| Listing URL       | https://chromewebstore.google.com/detail/igloknlllonknnbkfgggfkigmeegmakf |
| Published version | **8.3.1** — the floor any upload must clear                              |

<!-- The dashboard rejects an upload whose manifest.json version is not numerically
     higher than the published one: the 5.1.0 attempt failed on 2026-10-14 with
     "Invalid version number in manifest: 5.1.0 … larger than the published package:
     8.3.1". 9.0.0 clears it. Being higher than the last release in this repo is not
     the same test — check the dashboard. -->

## Store Listing

**Extension Name** [REQUIRED]

```
1-click timer
```

<!-- Must match manifest.json "name" exactly. Verified by src/manifest.test.ts. -->

**Short Description** [REQUIRED]

```
One-click countdown timer: click the dial to start, watch the minutes left on the toolbar badge, and get notified when time is up.
```

<!-- 130 characters, under the 132 limit. This is the same string as manifest.json
     "description" and package.json "description"; src/manifest.test.ts fails if
     they diverge or if it outgrows the limit. -->

**Detailed Description** [REQUIRED]

```
Set a countdown timer in a single click — no typing, no numbers to enter.

Move the pointer over the dial to preview a duration, then click to set it. Or click a numeral to start exactly that many minutes. The timer keeps going when you close the popup, and when you restart Chrome.

FEATURES
• One click to start: hover the dial to preview a duration, click to set it
• Or click a numeral to start that many minutes
• Setting a timer is always one click, even while another timer is already running
• Keeps counting when you close the popup or restart Chrome
• The minutes left stay on the toolbar badge, turning from green to red as time runs out
• A notification when the time is up, with Stop and Restart buttons, plus a chime of your choosing
• The alarm rings for as long as you choose — 5 seconds to 5 minutes — and sounds even when the popup is closed
• The timer comes to the front when the time is up, so you can see and stop the alarm
• Play, pause and stop from the corner of the dial, and restart from the control in the middle
• Light and dark appearance, following your system by default
• A remaining-time colour you can change — a conic sweep frozen when the timer starts, a gradient that follows the time left, red, or green — and a choice of alarm chimes
• A full-screen view for a timer you can watch from across the room

HOW TO USE
1. Click the 1-click timer icon in the toolbar
2. Move the pointer over the dial to preview a duration, then click to start it — or click a numeral to start that many minutes
3. Close the popup if you like: the badge keeps counting down
4. When the time is up, the alarm chimes and the timer comes to the front
5. Use the notification's Stop or Restart button (or the timer's own controls) to silence the alarm — Stop resets the timer, Restart runs the same duration again

PRIVACY
No account, no sign-in, no analytics, no network requests. Your timer and your preferences stay on your own device. Appearance and alarm preferences sync through your own Chrome profile so they follow you to your other computers — they are never sent to the developer.

PERMISSIONS
• Notifications — shows the "time is up" alert when a countdown finishes; it stays visible until you close it, and its Stop and Restart buttons handle the alarm without opening the timer.
• Alarms — wakes the timer at the moment the countdown ends, so the alert arrives on time even when the popup is closed.
• Storage — remembers a running timer across browser restarts, and saves your appearance and alarm preferences.
• Offscreen — plays the alarm sound from a hidden page inside the extension, so the alarm can ring even when no timer window is open. It never runs code from, or reads, any web page.

SUPPORT
Found a bug, or have an idea? Open an issue at https://github.com/alexewerlof/1-click-timer/issues

Open source (GPL-3.0). Made in Sweden.

Version 9.0.0 — the modern rewrite: a dial you set with one click, the minutes left on the toolbar badge, and an alarm that rings for as long as you choose even with no timer window open, with Stop and Restart on the notification.
```

<!-- The Chrome Web Store strips markdown, so this is plain text with • bullets. -->

**Category** [REQUIRED]

Productivity

**Single Purpose** [REQUIRED]

```
Sets a one-click countdown timer that keeps running in the background and alerts
you when it finishes.
```

**Primary Language** [REQUIRED]

English

## Graphics & Assets

| Asset                   | Dimensions            | Status         | Filename                                |
| ----------------------- | --------------------- | -------------- | --------------------------------------- |
| Store Icon [REQUIRED]   | 128×128 PNG           | ✅ Ready       | `dist/images/icon128.png`               |
| Screenshot 1 [REQUIRED] | 1280×800              | ✅ Ready       | `dashboard/screenshots/02-running.png`  |
| Screenshot 2 [RECOMMENDED] | 1280×800           | ✅ Ready       | `dashboard/screenshots/06-dark.png`     |
| Screenshot 3 [RECOMMENDED] | 1280×800           | ✅ Ready       | `dashboard/screenshots/03-preview.png`  |
| Screenshot 4            | 1280×800              | ✅ Ready       | `dashboard/screenshots/04-popup.png`    |
| Screenshot 5            | 1280×800              | ✅ Ready       | `dashboard/screenshots/05-settings.png` |
| Small Promo Tile [RECOMMENDED] | 440×280        | ✅ Ready       | `dashboard/screenshots/promo-440x280.png` |
| Marquee Promo Tile      | 1400×560              | ✅ Ready       | `dashboard/screenshots/promo-1400x560.png` |

All of them come from the gallery capture (`scripts/store/capture.mjs`, run for you
by `npm run release`), which loads the packed extension in Chromium and drives it
into each state, so a shot cannot show an interface that no longer exists. It writes
**six** screenshots and the two tiles, but the store accepts **at most five**, so
`01-idle.png` is not uploaded. The uploads are all 1280×800 — the size the store
prefers — and the tiles are 440×280 and 1400×560. `dashboard/screenshots/` is
gitignored: the captures are reproducible, and the v4 set was deleted on 2026-10-11
for going stale in the repo.

### Screenshot Notes

Capture them with `npm run release`. The table above is the upload order — the
running timer leads, the dark theme follows, then the pointer, the popup and the
settings screen.

1. **Mid-countdown** (`02-running.png`) — a timer with the remaining sector drawn
   part-way round and the readout showing the time left. This is the shot that
   explains the product, so it leads the gallery.
2. **Dark theme** (`06-dark.png`) — the same running timer in the dark appearance,
   since a lot of people run dark mode and it is worth showing that it is supported.
3. **Previewing** (`03-preview.png`) — the pointer on the disc mid-hover, showing the
   preview arc, the preview numeral, and the rest of the numeral ring faded out.
4. **The popup** (`04-popup.png`) — the face at its true 380×380 on a plain backdrop,
   so the listing shows the panel a user actually clicks. No browser or device chrome
   is drawn around it.
5. **Settings screen** (`05-settings.png`) — appearance (the mode and the
   remaining-time colour) and the alarm (volume, sound and ring length), above the
   footer of actions.

`01-idle.png` — the whole dial in the full-screen view, no timer running, in the
light theme — is captured but not uploaded: the store allows five shots, and the
running dial already shows the same face.

## Permissions Justification

| Permission      | Type          | Justification                                                                                                                                                                              |
| --------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `alarms`        | permissions   | Wakes the extension when a countdown ends so the "time is up" notification fires on time, even after the popup is closed or Chrome has restarted. Without it the alarm would only fire while the popup is open. |
| `notifications` | permissions   | Shows the desktop notification that tells the user their countdown has finished. It is the only way the extension can get attention when the timer ends and the popup is closed.             |
| `storage`       | permissions   | Remembers the running countdown across popup closes and browser restarts, and saves the user's appearance, alarm and colour preferences.                                                    |
| `offscreen`     | permissions   | Runs a hidden page that plays the alarm chime. An MV3 service worker has no way to play audio, so without this the alarm could only sound while a timer window happened to be open. The page plays audio and nothing else. |
| *(none)*        | host_permissions | The extension requests no host permissions. It does not read, change or observe any web page, and it makes no network requests.                                                          |

<!-- Each of these is also explained to the user in the listing's PERMISSIONS
     section, so what the user reads matches what the reviewer reads. -->

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

The developer receives and collects nothing. There is no analytics, no telemetry,
no crash reporting, no account and no server of any kind. The extension makes no
network requests at all.

| Data Type                     | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
| ----------------------------- | ---------- | ----------------------- | ------- | -------------------------- |
| Personally identifiable info  | No         | No                      | —       | No                         |
| Health info                   | No         | No                      | —       | No                         |
| Financial info                | No         | No                      | —       | No                         |
| Authentication info           | No         | No                      | —       | No                         |
| Personal communications       | No         | No                      | —       | No                         |
| Location                      | No         | No                      | —       | No                         |
| Web history                   | No         | No                      | —       | No                         |
| User activity                 | No         | No                      | —       | No                         |
| Website content               | No         | No                      | —       | No                         |

**Disclosure to make accurately:** the extension stores its preferences with
`chrome.storage.sync`. When the user is signed in to Chrome, Google syncs that
data through the user's own Google Account, which the review checklist counts as
off-device transmission. It goes to Google, not to the developer, under the user's
own account settings; the developer cannot read it. The timer itself is held in
on-device local storage. This is disclosed in `PRIVACY.md` and stated plainly in
the listing's PRIVACY section.

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [REQUIRED]

```
https://github.com/alexewerlof/1-click-timer/blob/master/PRIVACY.md
```

<!-- PRIVACY.md in this repo. The default branch is `master`, and the file must be
     pushed before submission — the review checklist auto-rejects a 404. Confirm
     the link loads in a private window. The policy matches the "no data
     collected" disclosure above. -->

## Distribution

**Visibility**: Public
**Regions**: All regions

## Developer Info

**Publisher Name** [REQUIRED]

Alex Ewerlöf

**Contact Email** [REQUIRED]

```
hello@alexewerlof.com
```

<!-- Monitored, and shown publicly on the listing. It is also the address in
     PRIVACY.md's Contact section, so the policy and the listing agree. -->

**Support URL / Email** [RECOMMENDED]

https://github.com/alexewerlof/1-click-timer/issues

**Homepage URL** [RECOMMENDED]

https://www.alexewerlof.com/

## Version History

| Version | Date       | Changes                                                                                                                                                                   | Status |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 9.0.0   | 2026-10-14 | Rewritten as a Manifest V3 extension: a dial where one click sets a duration, a toolbar badge that counts the minutes down, and a settings screen for appearance, alarm and colours. Adds a configurable alarm (5 seconds to 5 minutes, 10 seconds by default) played from an offscreen document, so it rings with no timer window open; a notification with Stop and Restart buttons that brings the timer to the front; and a remaining-time colour — including a conic sweep that freezes the badge's green → orange → red ramp to the dial when the timer starts. Replaces the Manifest V2 build. | Draft  |
| 8.3.1   | —          | Last version published to the store. Manifest V2.                                                                                                                         | Published |

## Review Notes

### Known Issues / Limitations

- **The toolbar badge counts whole minutes, never seconds.** Chrome wakes a
  background extension about once a minute, so a per-second badge would drift;
  the badge shows whole minutes left and its colour tracks the time remaining.
  The second-by-second countdown is on the timer face itself.
- **No ring/limits.** The dial starts a timer on a single click with no
  confirmation, including while another timer is running. That is intended, and
  stated in the listing: setting a timer is always one click, even while another
  timer is already running.

### Pre-submission checklist

- [x] Manifest V3
- [x] Version bumped above the published one (9.0.0 > 8.3.1)
- [x] Name in `manifest.json` matches the listing (enforced by `src/manifest.test.ts`)
- [x] Short description ≤ 132 characters (same test)
- [x] Every permission justified
- [x] No host permissions, no content scripts, no remote code
- [x] Privacy policy written and consistent with the disclosure
- [x] `npm run deploy` produces a clean ZIP containing only `dist/`
- [x] **Privacy policy pushed**, so the URL resolves (on `master` since the v5 merge)
- [x] **Screenshots captured** — five at 1280×800 (the capture writes six; `01-idle.png` is not uploaded)
- [x] **Promo tiles refreshed** — the 440×280 and 1400×560 tiles
- [x] **Contact email supplied** — `hello@alexewerlof.com`, also in `PRIVACY.md`
- [x] **Minimum Chrome version declared** — `minimum_chrome_version: "116"` in the manifest
- [x] Loaded unpacked in Chrome and exercised once more before uploading

### Rejection History

None yet.
