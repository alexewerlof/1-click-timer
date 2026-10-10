# What?

A simple and solid timer extension for Chrome.

# Use cases

- Teachers in the classroom to set a timer for students on the projector
- Conference organizers or presenters show a timer for breaks or time-bound assignments
- Neurodivergent users (e.g. ADHD) to set a timeout for different activities (e.g. using it as a Pomodoro timer to get focused work done)
- Generally anywhere a desktop timer can be useful, this extension comes handy as well.

# Features

- Slick design but not too distracting (my personal brand should be there but not too large and dominant. I just want to get credit as the creator but since it's free and I have no monetary incentives keep it small. It should just answer the curious user who wonders who is behind it).
- The general look and functionality should match that of common 60m timers that is used in schools already.
- The ability to set pre-allocated timers (e.g. start the timer for common periods like 5m, 10m, 15m, 25m, ideally the user should be able to configure their own presets and even label them like "Pomodoro" for 25m)
- Resilient: if the user restarts Chrome (e.g. for updating, or even accidentally), the timer should survive this even and keep counting
- Show the number of remaining minutes as a colored badge. Considering limitations of Chrome environment (timed events trigger every minute or so) we should still do our best to show the remaining time as accurately as possible.
- Full screen tab view as well as popup view (both show the same functionality).
- Notification popup when the time is up (shows the timer name and period)

# Interface

## UI elements

These names are the shared vocabulary for the interface. The code uses the same
words (see `src/app/lib/dial.ts` and `src/app/components/TimerFace/`), so a
change requested with one of these terms maps to one place in the source.

| Element             | What it is                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| **Face**            | The square SVG surface that holds everything below. It fills the space it is given.                     |
| **Dial**            | The circular instrument as a whole: the disc, its ticks and its numerals.                                |
| **Disc**            | The circle at the centre of the dial. The ticks straddle its edge, and the remaining sector fills it.    |
| **Tick**            | A short line marking a single minute.                                                                    |
| **Minor tick**      | A tick on a minute that is not a multiple of five.                                                       |
| **Major tick**      | The thicker tick on each multiple of five (0, 5, 10, … 55).                                              |
| **Numeral**         | The number printed beside a major tick: 0, 5, 10, … 55.                                                  |
| **Numeral ring**    | The circle that the numerals sit on, just outside the ticks.                                             |
| **Remaining sector**| The filled red wedge. It runs from 12 o'clock counter-clockwise to the current remaining time, and reaches the centre, so its size is the time left. |
| **Preview arc**     | The unfilled outline drawn from 12 o'clock to the minute currently under the pointer. It shows what a click would start. |
| **Preview ticks**   | The ticks inside the preview arc's span, drawn in the **Remaining sector**'s colour so the arc, its numeral and the ticks it covers read as one mark. The rest of the ring keeps the dial's ink. |
| **Preview numeral** | The single numeral shown while previewing. It sits on the numeral ring at the end of the preview arc, in the numerals' style and in the **Remaining sector**'s colour, and replaces the whole numeral ring so it is the only number on the face. A whole turn (60) is labelled where the 0 numeral sits. |
| **Readout**         | The digital `M:SS` in the middle of the disc, e.g. `1:05`. It always shows the remaining time.            |
| **Readout disc**    | The small circle behind the readout, sitting at the centre of the dial. It is white with a soft shadow, so it reads as a layer above the dial rather than a hole in it. |
| **Caption**         | The text "Made in Sweden", inscribed inside the disc on a circular path just above the bottom rim.        |
| **Creator mark**    | The logo plus "Alex Ewerlöf". Currently not drawn.                                                       |

Three related measures, used throughout the geometry:

- **Disc radius** — the radius of the disc.
- **Tick length** — how far a tick extends, measured across the disc edge.
- **Numeral radius** — how far out the numerals sit from the centre.

## UI areas

| Area                 | What it is                                                                          |
| -------------------- | ----------------------------------------------------------------------------------- |
| **Face slot**        | The region that holds the face. It takes the room the controls do not.              |
| **Preset bar**       | The row of pre-configured duration buttons (5m / 10m / 30m).                        |
| **Transport**        | The row of controls: pause/resume, mute, reset, restart, fullscreen.                |
| **Confirm replace**  | Shown in place of the transport row when a click would replace a running timer.      |
| **Dev bar**          | Development-only harness for parking the timer in a given state. Never shipped.     |

Icons come from **Lucide** (`lucide-react`), not hand-drawn SVG, so control
labels and glyphs stay conventional.

### Implementation status

Names above are implemented as written. Three deliberate deviations:

- **One dial only.** Alternatives that were explored during the React rewrite
  have been removed; the classic face is the only one.
- **The creator mark is currently hidden** (logo + "Alex Ewerlöf"). It is still
  part of this spec, gated by `SHOW_CREATOR_MARK` in `src/app/lib/dial.ts`; the
  band between the readout disc and the 0 numeral is left clear for it.
- **The bottom numeral is 30, not 40.** The list below says 40 sits at the
  bottom, which contradicts its own 5/55 statements. The uniform 0–60 mapping
  the code implements puts **30** there.

## Timer face

The timer face is primarily composed of an SVG that extends the available space. It has a square layout but expands to fill the available space. On rectangular screens (portrait or landscape) the space around is in the same color as the timer face.

The interface shows a circular analog timer for 60 minutes.

At the center of the face there's a circle that's used for showing the number of remaining minutes in digital format. For example if it's 1 minute and 5 seconds remaining till the alarm goes off, it shows 1:05.

Between the central circle and the 0 indicator, there's a logo and my name (Alex Ewerlöf).

Inside the disc, following a circular path just above the bottom rim, there's a text that reads "Made in Sweden".

Since the primary information that we should communicate to the user is the amount of remaining time, we should arrange the numbers in the counter-clockwise direction. This means:

- 0 is at the 12 o'clock position at the top of the timer face
- 5 is on the left of 0 (where normal clocks show 11)
- 55 is on the right side of 0 (where normal clocks show 1)
- 40 is at the diagonal opposite side of 0 at the bottom of the timer face (where normal clocks show 6)

> The last point contradicts the 5/55 points above it. The code follows the
> uniform 0–60 mapping, which puts **30** at the bottom — see "Implementation
> status".

Each minute is represented by a thin line.

The multiplies of 5 have a label: 0, 5, 10, 15, ..., 55 and a slightly thicker indicator.

When the user hovers over the disc — everywhere except the readout disc at its centre — a preliminary arc is drawn to show what alert will be set if they click. The number of minutes they are selecting is shown as the **preview numeral**: a single numeral drawn on the numeral ring at the end of the arc, in the numerals' style and the remaining sector's colour, so it reads as the arc's own label. The regular numerals are hidden while previewing, and the ticks the arc covers are drawn in that same colour, so the arc, its numeral and the ticks it covers read as one mark. The readout in the centre keeps showing the remaining time; it does not show the previewed duration.

If the user clicks somewhere, the corresponding timer will start. If there's an ongoing timer in progress and isn't over yet, we should ask the user whether they really want to set a new timer or not.

When the timer is running, a red area shows exactly how much time is remaining. For example if 3.4 minutes are remaining till the alarm goes off, the arc between 3.5 minutes till 0 and all the way to the center of the screen is red. This makes it super easy to quickly assess how much time is remaining. This area is filled in red whereas the preliminary arc is not filled. When the time is up, there's no arc.

## Settings

This screen allows the user to configure various aspects of the timer:

- Adjusting pre-configured periods and names (add/remove/update)
- Alarm volume (is maxed by default).
- Choosing a chime for when the time is up (including silent mode where no sound is played)
- Color of the timer face, remaining time, and ticks (this allows the users to set their own branding colors). These settings persist and are ideally synced across the same user's profiles if it doesn't require an extra permission.
- Set to default: resets all configs to factory settings.

# How to

## Set a custom timer

Hover your mouse over the disc — everywhere except the readout disc at its centre — and see how the preliminary indicator arc and the preview numeral at its end show what timer will start if you click.

Once you're happy, just click the screen and the timer starts with the number that's chosen.

## Set a pre-configured timer

By default, there are few buttons to start the timer: 5m, 10m and 30m.
The user can edit these preset values and even give them a custom name.

## Stop a timer

Stop and pause are the same thing. While the timer is running, the user can stop or resume the timer using the same button (a pause icon).

## Mute the timer

Whether the timer is running or stopped, the user can toggle the mute button.

## Reset the timer

Reset means the timer stops ticking and also the remaining time is set to zero.

## Restart the timer

When the timer is ringing, the user can press a rest button to restart the timer with the last config (e.g. if the alarm goes off after a 7m timer, pressing the restart button sets the timer for 7m again.)

If the timer has previously been reset, there is no memory of the last timer that was set, therefore the restart button is disabled because it doesn't make sense.

## Full screen

When the user opens the timer in the popup area, they can press a button to open the same timer in a tab. If they press this exact button while the timer screen is shown in the tag, the page goes to fullscreen mode.
