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
minutes. The 0 is the exception: it marks where a whole turn ends, so clicking it
resets the timer.

Setting a timer is always one click, even while another timer is already running.

### Stop and resume

The play/pause control sits in the bottom-left corner of the dial: a pause glyph
while the timer runs, a play glyph while it is paused. Clicking it stops or resumes.

### Restart

Hover the readout disc in the centre and a restart glyph appears while the timer is
paused or the alarm is ringing. It runs the last duration again from the start: set
a timer for 10 minutes, pause it at 5, and Restart runs the full 10 minutes. While
the timer is running — use the corner control to pause it first — or once you have
reset it, there is nothing to restart, so the disc stays bare.

### When the time is up

The alarm chimes for as long as you chose in the settings — 10 seconds by default.
It rings even when the popup is closed: the sound comes from the extension, not
from the timer on screen. The toolbar icon turns red while it sounds and returns
to normal when it stops.

A notification appears, and the timer window — or a new one, if none is open —
comes to the front so you can see what is ringing.

To silence the alarm you can use the notification's own buttons: **Stop**, and
**Restart**. Stop silences the alarm and resets the timer — exactly what closing
the notification does. Restart silences it too, and immediately starts a new
countdown of the same length. The timer's own controls do the same: the restart
glyph on the readout disc, or the Stop control in the bottom-left corner. Whichever
you use, the sound stops at once, so an alarm you have acknowledged never rings on.
Resetting the timer — or dismissing the notification — also clears the notification
if it is still showing.

### Mute, play/pause and full screen

The corners of the dial's square hold four controls: mute (top left), fullscreen
(top right), play/pause (bottom left) and settings (bottom right). To stop a timer
and clear the remaining time, click the 0 numeral — or use the Stop control in the
bottom-left corner while the alarm is ringing.

The fullscreen control opens the same timer in a tab — or, if you already have that
tab open, brings it to the front (even from another window) — and pressed again in
that tab it goes full screen. Its glyph shows which way it will go.

### Settings

The gear opens the settings screen in a new tab:

- **Appearance** — the mode (light, dark, or device, which follows your system and is the default) and the remaining-time colour: red, green, or a gradient that follows the time left
- **Alarm** — the volume, a choice of chime (Chime, Beep, Bell or Silent) with a preview button, and how long the alarm rings (5 seconds to 5 minutes)
- **Reset to defaults**

Your settings sync across your own Chrome profiles.

## Features

- One click to start: hover the dial to preview a duration, click to set it
- Or click a numeral to start that many minutes
- Keeps counting when you close the popup or restart Chrome
- Remaining minutes on the toolbar badge, moving from green through orange to red as time runs out
- An alarm that rings for a length you choose and sounds even with the popup closed
- A notification with **Stop** and **Restart** buttons, plus the timer brought to the front, so it is clear what is ringing and how to stop or repeat it
- Light and dark appearance, following your system by default
- A remaining-time colour of your choice — red, green, or a gradient that follows the time left
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
