# src/ — source code

Layers, deliberately separate:

1. **`shared/`** — the timer protocol (record, reducer, storage keys) shared by
   the worker and the UI, so both agree on what an action does.
2. **`background/`** — the service worker. Framework-free TypeScript; no React.
3. **`app/runtime/`** — the contracts the UI talks to (time, and settings).
4. **`app/`** — the React UI. Presentation only; it never keeps time itself.

**Names come from the spec.** `MANUAL.md` → "UI elements" defines the vocabu-
lary (face, dial, disc, tick, major tick, numeral, remaining sector, preview
arc, readout, readout disc, caption). Code identifiers use those exact words, so
a change asked for in one term maps to one place in the source. There is exactly
one dial face; the multi-variant experiment is over.

## Files

| Path                                | Role                                                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `manifest.json`                     | Extension manifest (MV3). Service worker runs as an ES module.                                              |
| `popup.html`                        | Popup entry. Sets `data-surface="popup"`.                                                                   |
| `fullscreen.html`                   | Tab entry for the big view. Sets `data-surface="fullscreen"`.                                               |
| `app/main.tsx`                      | Mounts `App`; imports the global CSS.                                                 |
| `app/TimerApp.tsx`                  | The timer composition shared by the popup and the tab.                                                      |
| `app/components/TimerFace/`         | The dial. Geometry in `lib/dial.ts`; one component per element (`Disc`, `RemainingTime`, `PreviewArc`, `PreviewTicks`, `PreviewNumeral`, `CenterReadout`, `ReadoutControl`, `Caption`, `CreatorMark`); static chrome in `dialChrome.tsx` (`DIAL_TICKS`, `DIAL_NUMERALS`, and the `Tick` both tick groups share). `ReadoutControl` is the one non-SVG element — an HTML `<button>` overlaid on the face. |
| `app/components/TransportControls/` | The four corner controls (mute, fullscreen, reset, and settings), ghost glyphs pinned to the corners of the dial's square. Icons from Lucide. The fullscreen control shows expand or shrink with the document's own fullscreen state. The settings control opens `settings.html` in a new tab (`openSettings` in `app/lib/surface.ts`); the About-the-author link inside that screen opens the author's site (`AUTHOR_SITE_URL` + `openTab`, both from `app/lib/links.ts`). The group fades out while the dial is previewed, so nothing competes with the choice being made. Pause/resume and restart are the `ReadoutControl` on the readout disc. |
| `app/design/tokens.css`             | Every colour, size and stroke weight. The light palette is `:root`; `[data-theme='dark']` overrides it.      |
| `app/design/global.css`             | Resets, body, and the popup/tab/settings sizing per `[data-surface]`.                                                |
| `app/lib/dial.ts`                   | Dial geometry: counter-clockwise mapping, sector/arc paths, pointer → dial point/minute, disc/readout-disc regions, and the derived readout size. |
| `app/lib/time.ts`                   | `MAX_MINUTES` clamp and `formatClock`.                                                                     |
| `app/lib/surface.ts`                | Surface type, `readSurface`, `openSettings`, and the fullscreen button behaviour.                                           |
| `app/lib/links.ts`                  | Outbound destinations (`AUTHOR_SITE_URL`) and `openTab`, the one way the app opens a new tab: `chrome.tabs` in the extension, `window.open` in the design preview. |
| `app/lib/useDocumentFullscreen.ts`  | `useSyncExternalStore` binding to the Fullscreen API's `fullscreenchange` event.                            |
| `app/runtime/types.ts`              | `TimerState` / `TimerRuntime` contract (the timer seam).                                                     |
| `app/runtime/mockRuntime.ts`        | In-memory implementation (interval-driven) + `forceStatus`, the mock-only parking helper (`MockRuntime`) the visual tests use to freeze a state.                                              |
| `app/runtime/runtime.ts`            | Picks the chrome runtime in the extension, the mock in a plain browser.                                                                         |
| `app/runtime/useTimerState.ts`      | `useSyncExternalStore` binding.                                                                                           |
| `background/index.ts`               | Service worker: the single writer of the timer record, alarms, badge/icon, notifications, messages.          |
| `background/badge.ts`               | The toolbar badge: whole minutes left as text, and the green→orange→red colour for the fraction of the running timer that is left. Pure (no `chrome.*`), so `npm test` covers it; the worker only applies the plan. |
| `images/`                           | Extension icons (toolbar/store). Copied verbatim into `dist/`.                                              |

### Added in Phase 3

| Path                                          | Role                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| `settings.html`                               | Settings-screen entry. Sets `data-surface="settings"`.                     |
| `app/App.tsx`                                 | Picks `SettingsApp` or `TimerSurface`; applies the theme.                  |
| `app/TimerSurface.tsx`                        | Wires `useAlarmSound` + audio priming + theme around `TimerApp`.           |
| `app/SettingsApp.tsx`                         | The settings screen (appearance, volume, chime, colours, reset, about).    |
| `app/design/palette.ts`                       | The colour swatches and the custom properties each slot drives.            |
| `app/lib/chimes.ts`                           | Synthesised chimes (`Chime`/`Beep`/`Bell`/`Silent`) and audio priming.      |
| `app/runtime/settings.ts`                     | `TimerSettings` / `SettingsStore` contract, defaults, normalization.       |
| `app/runtime/mockSettings.ts`                 | localStorage-backed settings store for the design preview and tests.       |
| `app/runtime/chromeSettings.ts`               | `chrome.storage.sync` settings store with a local fallback.                |
| `app/runtime/settingsRuntime.ts`              | The settings seam (chrome vs mock).                                        |
| `app/runtime/useSettings.ts`                  | `useSyncExternalStore` binding for settings.                               |
| `app/runtime/useSettingsTheme.ts`             | Resolves the theme and writes the colour overrides to `<html>`.            |
| `app/runtime/useAlarmSound.ts`                | Rings the chosen chime while the timer is `expired`.                       |
| `app/runtime/platform.ts`                     | `isExtension()` — the chrome-or-mock switch both seams use.                |
| `app/runtime/chromeRuntime.ts`                | The `chrome.storage` + messaging `TimerRuntime`.                           |
| `app/runtime/timerState.ts`                   | Maps a stored record to the UI `TimerState`.                               |
| `shared/timer.ts`                             | The timer record, the pure reducer, and the worker/UI message protocol.    |

## Key patterns

- **Time is a timestamp.** State holds an absolute `endTime`; remaining seconds
  are computed, never accumulated. This is what survives SW termination.
- **One visual source of truth.** All colours live in `design/tokens.css`;
  components only reference `var(--…)`. Nothing names a colour directly.
- **Derive, don't eyeball.** `READOUT_FONT_SIZE` comes from
  `readoutFontSizeFor(READOUT_DISC_RADIUS, …)`, and both shadows come from
  `shadowFor(radius, ratios)`, sized off the radius they ride so they stay in
  proportion if the dial is resized. The disc's inner shadow deliberately uses
  tighter ratios than the readout disc's: scaled to the disc's radius, the
  readout's proportions greyed the whole face. `DIAL_VIEWBOX` is derived from
  `NUMERAL_RADIUS` for the same reason — hand-picked sizes drift the moment the
  geometry is tuned.
- **Shadows are SVG filters**, not CSS `box-shadow` (SVG has no such property),
  and the disc has no outline: `DISC_INNER_SHADOW` is what draws its edge.
  `Disc` subtracts an offset copy of the disc from itself (`feComposite
  operator="out"`), which leaves the shadow inside the rim; `CenterReadout`
  declares an `feDropShadow` instead. Two details matter to both: the filter
  region is widened so the blur is not clipped at the disc's edge, and
  `colorInterpolationFilters="sRGB"` is set because the SVG default
  (`linearRGB`) renders the shadow far lighter than the token looks. The colour
  reaches each filter through `style={{ floodColor: 'var(--…)' }}`, which does
  resolve custom properties on presentation attributes.
- **Static SVG is hoisted.** The tick and numeral rings are built once at
  module load (`DIAL_TICKS`, `DIAL_NUMERALS`). Only the sector and the preview
  chrome are stateful: previewing swaps the numeral ring for the preview numeral
  and redraws the covered ticks in the remaining colour, over the untouched ring
  (MANUAL "Preview numeral", "Preview ticks").
- **One click sets a timer.** Clicking the disc starts the previewed duration;
  clicking a numeral starts that many minutes outright (the 0 numeral marks a
  whole turn, so it starts 60). A numeral carries `data-numeral-minutes`, which
  is how the click is resolved (`handleClick` in `TimerFace`) — the pointer's
  position cannot identify a numeral because it sits off the disc.
  `pointer-events: bounding-box` (see `TimerFace.module.css`) gives each numeral
  a solid hit area, and hovering one takes `--remaining` — the same interactive
  signal the preview arc and preview numeral use. Nothing asks for confirmation,
  even when a timer is already running.
- **The readout control is HTML, not SVG.** Pause/resume (and restart, while
  ringing) is a real `<button>` (`ReadoutControl`) overlaid on the readout disc as
  a *sibling* of the `<svg>` — a `<button>` is not valid in the SVG namespace, and
  a focusable button nested in the face's `role="slider"` would make the
  accessibility tree ambiguous. Its click surface is the whole disc: the size is
  `READOUT_DISC_DIAMETER_RATIO` (from `dial.ts`) times the face's rendered side,
  which is `cqmin` because the square viewBox is letterboxed (see `.stage`). It is
  revealed on hover or focus, and always under `@media (hover: none)`.
- **The corner controls overlay the face.** `TransportControls` is a sibling of the
  face inside `.faceSlot` (which is the size container, see
  `TimerApp.module.css`), so the dial is not shortened by a controls row. The
  overlay is sized to the *letterboxed square* rather than the slot — it offsets
  itself by half the letterbox margin (`calc(50cqw - 50cqmin)`) — so its corners
  are the corners of the dial's square, and the same file's CSS pins one control
  to each. It takes the pointer only on its buttons, so the dial underneath keeps
  the rest. The group fades out while the dial is previewed — keyed off the
  face's `data-pickable` attribute with `:has()`, the same signal that drives the
  cursor and the numeral swap — and fades back when the pointer leaves the disc.
  The sizes are `cqmin` tokens (`--size-corner-control`, `--size-corner-icon`),
  so the glyphs keep their weight against the dial instead of staying a fixed
  18px on a large fullscreen face; the icon is a percentage of the control,
  which is why the control resets the button's default padding.
- **Pointer maths uses `getScreenCTM()`**, so scaling or letterboxing of the
  element cannot skew the selected minute.
- **Two surfaces, one app.** `popup.html` and `fullscreen.html` mount the same
  `TimerApp`; only `data-surface` changes the sizing.
- **Icons are Lucide**, not hand-drawn SVG — conventional glyphs and one source
  of truth for stroke weight.
- **The creator mark is inlined art.** `CreatorMark` embeds the Alex Ewerlöf
  wordmark's paths (from the old `alexewerlof-logo.svg`, now deleted) and fills
  them with `--dial-mark`, so it recolours with the numerals and ticks. Filled,
  not stroked: the source is a hairline outline that would vanish on the popup.
  It is placed by `CREATOR_MARK_*` in `lib/dial.ts`, in the band between the
  readout disc and the 0 numeral.
- **Service worker logs** are prefixed `[1-click-timer:sw]`.
- **The worker is the single writer.** Every action is a `TimerRequest` message;
  the worker applies `reduceTimer` (in `shared/timer.ts`), persists to
  `chrome.storage.local` and reschedules alarms. The UI reads state back through
  `chrome.storage.onChanged`, never by writing. `chromeRuntime` adds a 250 ms
  interval while running so the dial stays smooth.
- **The timer is an absolute `endTime`.** Remaining seconds are always derived,
  never accumulated, so it survives service-worker termination;
  `expireIfElapsed` resolves a run-out timer to `expired` at read time on both
  sides.
- **Settings are their own store.** `SettingsStore` mirrors `TimerRuntime`'s
  `getState`/`subscribe` shape; `chromeSettings` uses `storage.sync` with a local
  fallback, `mockSettings` uses `localStorage`. Anything read from storage goes
  through `normalizeSettings`.
- **The theme is one attribute and three overrides.** `useSettingsTheme` sets
  `data-theme` (Auto resolved via `prefers-color-scheme`) and writes the face /
  ticks / remaining overrides as inline custom properties — the base palette
  stays in `tokens.css`.

## Tests

- `app/lib/*.test.ts`, `app/runtime/*.test.ts` — node project (`npm test`).
- `app/TimerApp.visual.test.tsx` — browser project; baselines live in
  `app/__screenshots__/` (`npm run test:visual`, `test:visual:update` to rewrite).
  It also measures the rendered readout with `getBBox()` and asserts it fits
  inside the readout disc — the one place the real text box is knowable, and a
  bug that regressed twice.

## Build pipeline

`vite.config.ts` sets `root: src`, so dev URLs match the built extension. Vite
bundles `popup.html`, `fullscreen.html`, `settings.html` and `background/index.ts`, then the
`extensionAssets` plugin copies `manifest.json` and `images/` into
`dist/`.
