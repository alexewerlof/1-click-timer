# Chrome Web Store Listing — 1-click timer

> Last Updated: 2026-10-11

The single source of truth for everything typed into the Chrome Developer
Dashboard. Copy from here, not from memory. `PRIVACY.md` and `dashboard/` are the
companions: the policy is the hosted page, this file is the listing.

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
• Keeps counting when you close the popup or restart Chrome
• The minutes left stay on the toolbar badge, turning from green to red as time runs out
• A notification when the time is up, plus a chime of your choosing
• Pause, resume and restart from the control in the middle of the dial
• Light and dark appearance, following your system by default
• Three colours you can change, and a choice of alarm chimes
• A full-screen view for a timer you can watch from across the room

HOW TO USE
1. Click the 1-click timer icon in the toolbar
2. Move the pointer over the dial to preview a duration, then click to start it — or click a numeral to start that many minutes
3. Close the popup if you like: the badge keeps counting down
4. When the time is up a notification appears, and the chime plays if the timer is on screen

PRIVACY
No account, no sign-in, no analytics, no network requests. Your timer and your preferences stay on your own device. Appearance and alarm preferences sync through your own Chrome profile so they follow you to your other computers — they are never sent to the developer.

PERMISSIONS
• Notifications — shows the "time is up" alert when a countdown finishes.
• Alarms — wakes the timer at the moment the countdown ends, so the alert arrives on time even when the popup is closed.
• Storage — remembers a running timer across browser restarts, and saves your appearance and alarm preferences.

SUPPORT
Found a bug, or have an idea? Open an issue at https://github.com/alexewerlof/1-click-timer/issues

Open source (GPL-3.0). Made in Sweden.

Version 5.0.0 — rebuilt for the current Chrome extension platform, with a new dial interface and a settings screen.
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

| Asset                   | Dimensions            | Status         | Filename               |
| ----------------------- | --------------------- | -------------- | ---------------------- |
| Store Icon [REQUIRED]   | 128×128 PNG           | ✅ Ready       | `src/images/logo128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400   | ⬜ Not created |                        |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created |                      |
| Screenshot 3 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created |                      |
| Screenshot 4            | 1280×800 or 640×400   | ⬜ Not created |                        |
| Screenshot 5            | 1280×800 or 640×400   | ⬜ Not created |                        |
| Small Promo Tile [RECOMMENDED] | 440×280        | ⬜ Not created |                        |
| Marquee Promo Tile      | 1400×560              | ⬜ Not created |                        |

The v4 screenshots and promo tiles were deleted on 2026-10-11: they showed the
pre-React interface, and the review checklist treats outdated screenshots as a
rejection risk. New ones are needed before submission.

### Screenshot Notes

Shoot the built extension from `dist/`, at 1280×800 (preferred) or 640×400.

1. **Idle face** — the whole dial, no timer running, in the light theme.
2. **Mid-countdown** — a timer with the remaining sector drawn part-way round and
   the readout showing the time left. This is the shot that explains the product.
3. **Previewing** — pointer on the disc mid-hover, showing the preview arc, the
   preview numeral and the corner controls faded out.
4. **Full-screen view** — the tab-sized face, to show it scales up.
5. **Settings screen** — appearance, alarm and the colour slots, which also shows
   the icon footer.
6. **Dark theme** — any of the above with the dark appearance, since a lot of
   people run dark mode and it is worth showing that it is supported.

## Permissions Justification

| Permission      | Type          | Justification                                                                                                                                                                              |
| --------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `alarms`        | permissions   | Wakes the extension when a countdown ends so the "time is up" notification fires on time, even after the popup is closed or Chrome has restarted. Without it the alarm would only fire while the popup is open. |
| `notifications` | permissions   | Shows the desktop notification that tells the user their countdown has finished. It is the only way the extension can get attention when the timer ends and the popup is closed.             |
| `storage`       | permissions   | Remembers the running countdown across popup closes and browser restarts, and saves the user's appearance, alarm and colour preferences.                                                    |
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

⬜ **PENDING** — the Chrome Web Store requires a monitored address here, and it is
shown publicly on the listing. It also belongs in the "Contact" section of
`PRIVACY.md`, which currently points at the issue tracker.

**Support URL / Email** [RECOMMENDED]

https://github.com/alexewerlof/1-click-timer/issues

**Homepage URL** [RECOMMENDED]

https://www.alexewerlof.com/

## Version History

| Version | Date       | Changes                                                                                                                                                                   | Status |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 5.0.0   | 2026-10-11 | Rewritten as a Manifest V3 extension. New dial interface with one-click duration setting, a toolbar badge that counts the minutes down, a notification when the time is up, and a settings screen for appearance, alarm and colours. Replaces the v4 background-page build, which had no badge and no settings screen. | Draft  |
| 4.0     | —          | Last version published to the store. Manifest V2.                                                                                                                          | Published |

## Review Notes

### Known Issues / Limitations

- **The alarm chime needs a timer on screen.** Sound is played by the open popup
  or tab, not by the background service worker, so with the popup closed the user
  gets the notification but not the sound. The listing states this explicitly
  rather than implying a sound always plays. A fix is on the roadmap.
- **Numerals under the remaining sector render dark red.** The translucent
  remaining-sector fill sits over the numeral ring, so covered numerals read
  darker than uncovered ones. Cosmetic, and noticeable in a running screenshot —
  worth fixing before shooting the gallery images.
- **No ring/limits.** The dial starts a timer on a single click with no
  confirmation, including while another timer is running. That is intended, and
  stated in the listing: setting a timer is always one click.

### Pre-submission checklist

- [x] Manifest V3
- [x] Version bumped above the published one (5.0.0 > 4.0)
- [x] Name in `manifest.json` matches the listing (enforced by `src/manifest.test.ts`)
- [x] Short description ≤ 132 characters (same test)
- [x] Every permission justified
- [x] No host permissions, no content scripts, no remote code
- [x] Privacy policy written and consistent with the disclosure
- [x] `npm run deploy` produces a clean ZIP containing only `dist/`
- [ ] **Privacy policy pushed**, so the URL resolves
- [ ] **Screenshots captured** (at least one, 1280×800 or 640×400)
- [ ] **Promo tiles refreshed** (optional but recommended)
- [ ] **Contact email supplied**
- [ ] Loaded unpacked in Chrome and exercised once more before uploading

### Rejection History

None yet.
