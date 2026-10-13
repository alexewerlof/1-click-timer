# 1-click timer

A countdown timer for Chrome that you set in a single click. Hover the dial, click,
and it starts — no typing and no numbers to enter.

It keeps counting when you close the popup and when you restart Chrome. The minutes
left stay on the toolbar badge, and when the time is up an alarm rings and a
notification tells you — even when no timer is on screen.

## Who it is for

- Teachers, running a timed activity on the classroom projector
- Presenters and conference hosts, timing breaks and sessions
- Anyone using a Pomodoro-style focus timer who does not want another app open
- Anywhere a desktop timer helps and a whole application would not

## Install

Install it from the Chrome Web Store. The store version is still v4; the interface
in this repository (v5) is on its way.

To run the current source instead, see [CONTRIBUTING.md](CONTRIBUTING.md).

## How to use

### Set a timer

Move the pointer over the dial — anywhere except the small readout disc in the
middle. The face draws a preview arc showing the duration you are choosing, with
its numeral at the end of the arc. Click to start it.

To skip the dial, click a numeral on the ring and the timer starts at that many
minutes. The 0 marks a whole turn, so it starts 60 minutes.

Setting a timer is always one click, even while another timer is already running.

### Stop and resume

Hover the readout disc in the centre and a control appears: a pause glyph while the
timer runs, a play glyph while it is paused. Clicking it stops or resumes.

### Restart

While the alarm is ringing, the same disc offers a restart glyph, which runs the
last duration again. Once you reset the timer there is nothing to restart, so the
control is disabled.

### When the time is up

The alarm chimes for as long as you chose in the settings — 10 seconds by default.
It rings even when the popup is closed: the sound comes from the extension, not
from the timer on screen. The toolbar icon turns red while it sounds and returns
to normal when it stops.

A notification appears, and the timer window — or a new one, if none is open —
comes to the front so you can see what is ringing.

To silence the alarm, close the notification, or use the timer's own controls (the
restart glyph on the readout disc, or the reset button in the bottom-left corner).
Any of these stops the sound and resets the timer, so it will not ring again for
one you have already acknowledged. Closing the notification or resetting the timer
also dismisses the notification if it is still showing.

### Mute, reset and full screen

The corners of the dial's square hold four controls: mute (top left), fullscreen
(top right), reset (bottom left) and settings (bottom right). Reset stops the timer
and clears the remaining time.

The fullscreen control opens the same timer in a tab — or, if you already have that
tab open, brings it to the front (even from another window) — and pressed again in
that tab it goes full screen. Its glyph shows which way it will go.

### Settings

The gear opens the settings screen in a new tab:

- **Appearance** — light, dark, or auto, which follows your system and is the default
- **Alarm** — the volume, a choice of chime (Chime, Beep, Bell or Silent) with a preview button, and how long the alarm rings (5 seconds to 5 minutes)
- **Colours** — the face, the ticks and the remaining indicator, each with a small set of swatches plus Auto
- **Reset to defaults**

Your settings sync across your own Chrome profiles.

## Features

- One click to start: hover the dial to preview a duration, click to set it
- Or click a numeral to start that many minutes
- Keeps counting when you close the popup or restart Chrome
- Remaining minutes on the toolbar badge, moving from green through orange to red as time runs out
- An alarm that rings for a length you choose and sounds even with the popup closed
- A notification, plus the timer brought to the front, so it is clear what is ringing and how to stop it
- Light and dark appearance, following your system by default
- A full-screen view for a timer you can watch from across the room

The badge counts whole minutes and never seconds, because Chrome only wakes a
background extension about once a minute.

## Privacy

No account, no sign-in, no analytics and no network requests. The timer and your
preferences stay on your device, and preferences sync through your own Chrome
profile.

The extension asks for four permissions, and for no access to the pages you visit:
`alarms` to fire the alert at the right moment, `notifications` for the "time is
up" alert, `storage` to remember the timer and your settings, and `offscreen` to
play the alarm sound from a hidden page, so the alarm can ring with no timer
window open.

See [PRIVACY.md](PRIVACY.md).

## Links

- [Report a bug or ask for a feature](https://github.com/alexewerlof/1-click-timer/issues)
- [Source code](https://github.com/alexewerlof/1-click-timer)
- [The author](https://www.alexewerlof.com/)

Licensed under the GPL-3.0. Made in Sweden.
