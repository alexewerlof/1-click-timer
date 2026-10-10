# src/ — source code

Three layers, deliberately separate:

1. **`background/`** — the service worker. Framework-free TypeScript; no React.
2. **`app/runtime/`** — the contract the UI talks to about time.
3. **`app/`** — the React UI. Presentation only; it never keeps time itself.

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
| `app/main.tsx`                      | Mounts `TimerApp`, reads the surface, injects the dev harness in development builds.                        |
| `app/TimerApp.tsx`                  | Composition shared by both surfaces, plus the "replace a running timer?" flow.                              |
| `app/components/TimerFace/`         | The dial. Geometry in `lib/dial.ts`; one component per element (`Disc`, `RemainingTime`, `PreviewArc`, `CenterReadout`, `Caption`, `CreatorMark`); static chrome in `dialChrome.tsx`. |
| `app/components/PresetBar/`         | Pre-configured durations (MANUAL "Set a pre-configured timer").                                             |
| `app/components/TransportControls/` | Pause/resume, mute, reset, restart, fullscreen. Icons from Lucide.                                          |
| `app/components/ConfirmReplace/`    | Consent before replacing a timer that is still in progress.                                                 |
| `app/components/DevBar/`            | Design harness (`import.meta.env.DEV` only): parks the timer in a given state.                              |
| `app/design/tokens.css`             | Every colour, size and stroke weight, in one `:root` block.                                                 |
| `app/design/global.css`             | Resets, body, and the popup/tab sizing per `[data-surface]`.                                                |
| `app/lib/dial.ts`                   | Dial geometry: counter-clockwise mapping, sector/arc paths, pointer → dial point/minute, disc/readout-disc regions, and the derived readout size. |
| `app/lib/time.ts`                   | `MAX_MINUTES` clamp, `formatClock`, `toWholeMinutes`.                                                       |
| `app/lib/surface.ts`                | Surface type, `readSurface`, and the fullscreen button behaviour.                                           |
| `app/runtime/types.ts`              | `TimerState` / `TimerRuntime` contract. **The seam Phase 3 implements.**                                    |
| `app/runtime/mockRuntime.ts`        | In-memory implementation (interval-driven) + `forceStatus` for the harness.                                               |
| `app/runtime/runtime.ts`            | The single line that swaps mock → Chrome runtime.                                                                         |
| `app/runtime/useTimerState.ts`      | `useSyncExternalStore` binding.                                                                                           |
| `app/runtime/presets.ts`            | Factory presets (5m / 10m / 30m).                                                                                         |
| `background/index.ts`               | Service worker: storage, alarms, badge/icon, notifications, messages.                                                     |
| `images/`, `audio/`                 | Extension icons (toolbar/store) and the alarm sound. Copied verbatim into `dist/`.                          |

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
- **Static SVG is hoisted.** Tick and numeral geometry is built once at module
  load (`DIAL_TICKS`, `DIAL_CHROME`); only the sector and preview arc are stateful.
- **Pointer maths uses `getScreenCTM()`**, so scaling or letterboxing of the
  element cannot skew the selected minute.
- **Two surfaces, one app.** `popup.html` and `fullscreen.html` mount the same
  `TimerApp`; only `data-surface` changes the sizing.
- **Icons are Lucide**, not hand-drawn SVG — conventional glyphs and one source
  of truth for stroke weight.
- **Service worker logs** are prefixed `[1-click-timer:sw]`.

## Tests

- `app/lib/*.test.ts`, `app/runtime/*.test.ts` — node project (`npm test`).
- `app/TimerApp.visual.test.tsx` — browser project; baselines live in
  `app/__screenshots__/` (`npm run test:visual`, `test:visual:update` to rewrite).
  It also measures the rendered readout with `getBBox()` and asserts it fits
  inside the readout disc — the one place the real text box is knowable, and a
  bug that regressed twice.

## Build pipeline

`vite.config.ts` sets `root: src`, so dev URLs match the built extension. Vite
bundles `popup.html`, `fullscreen.html` and `background/index.ts`, then the
`extensionAssets` plugin copies `manifest.json`, `images/` and `audio/` into
`dist/`.
